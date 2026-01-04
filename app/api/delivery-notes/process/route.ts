// app/api/delivery-notes/process/route.ts

/**
 * POST /api/delivery-notes/process
 * Process delivery note with OCR
 * Based on GPT-5 implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { logOcrStep } from '@/lib/ocr/logger';
import { runTextract } from '@/lib/ocr/clients/textract';
import { runGoogleDocAI } from '@/lib/ocr/clients/docai';
import { parseDeliveryNoteFromTextract } from '@/lib/ocr/parsers/deliveryNote';
import { DeliveryNoteResultSchema } from '@/lib/ocr/schemas';
import {
 OCRProcessingError,
 StorageError,
 ValidationError,
} from '@/lib/ocr/errors';
import { uploadDeliveryNoteFile } from '@/lib/storage/documents';
import { assertRateLimit } from '@/lib/rateLimit';
import { checkIdempotency, storeIdempotency } from '@/lib/idempotency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function newCorrelationId(): string {
 return crypto.randomUUID();
}

function badRequest(msg: string) {
 return NextResponse.json({ success: false, error: msg }, { status: 400 });
}

/**
 * POST multipart/form-data
 * - file: PDF eller bild
 * - idempotency-key: (header) valfritt
 */
export async function POST(req: NextRequest) {
 const correlationId = newCorrelationId();
 let tenantId: string | null = null;
 let storagePath: string | undefined;

 try {
  // Auth / tenant
  tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json(
    { success: false, error: 'Ingen tenant hittades' },
    { status: 401 }
   );
  }

  // Rate limit
  await assertRateLimit(tenantId, '/api/delivery-notes/process', 12);

  // Idempotency
  const idemKey = req.headers.get('idempotency-key');
  const cached = await checkIdempotency(
   tenantId,
   '/api/delivery-notes/process',
   idemKey
  );
  if (cached) {
   return NextResponse.json(cached, { status: 200 });
  }

  // Read multipart
  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) {
   return badRequest('Filen saknas (form field "file")');
  }

  const mimeType = file.type || 'application/pdf';
  const bytes = new Uint8Array(await file.arrayBuffer());
  const buffer = Buffer.from(bytes);

  // Validate file size (max 10MB)
  if (buffer.byteLength > 10 * 1024 * 1024) {
   return NextResponse.json(
    { success: false, error: 'Filen är för stor (max 10MB)' },
    { status: 413 }
   );
  }

  // Validate file type
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(mimeType)) {
   return badRequest('Ogiltig filtyp. Endast PDF och bilder tillåtna.');
  }

  // Store original file
  await logOcrStep({
   tenantId,
   correlationId,
   docType: 'delivery_note',
   stage: 'received',
   message: 'File received',
   meta: { mimeType, size: buffer.byteLength },
  });

  const { path } = await uploadDeliveryNoteFile(
   tenantId,
   buffer,
   mimeType
  ).catch((e) => {
   throw new StorageError('Uppladdning misslyckades', { err: String(e) });
  });

  storagePath = path;

  await logOcrStep({
   tenantId,
   correlationId,
   docType: 'delivery_note',
   stage: 'uploaded',
   filePath: path,
  });

  // Run Textract with retry
  await logOcrStep({
   tenantId,
   correlationId,
   docType: 'delivery_note',
   stage: 'textract_started',
  });

  let textractOk = true;
  let parsed;

  try {
   const tx = await runTextract(bytes, mimeType);
   await logOcrStep({
    tenantId,
    correlationId,
    docType: 'delivery_note',
    stage: 'textract_done',
    meta: { confidence: tx.modelConfidence },
   });

   parsed = parseDeliveryNoteFromTextract(
    tx.blocks,
    tx.rawText,
    tx.modelConfidence
   );
  } catch (err) {
   textractOk = false;
   await logOcrStep({
    tenantId,
    correlationId,
    docType: 'delivery_note',
    stage: 'textract_failed',
    level: 'warn',
    message: 'Textract failed, trying DocAI',
    meta: { err: String(err) },
   });
  }

  // Fallback DocAI
  if (!parsed) {
   try {
    const da = await runGoogleDocAI(bytes, mimeType);
    await logOcrStep({
     tenantId,
     correlationId,
     docType: 'delivery_note',
     stage: 'docai_done',
     meta: { confidence: da.confidence },
    });

    // Reuse parser (it can handle text-only input)
    parsed = parseDeliveryNoteFromTextract([], da.text, da.confidence);
   } catch (docaiErr) {
    await logOcrStep({
     tenantId,
     correlationId,
     docType: 'delivery_note',
     stage: 'docai_failed',
     level: 'error',
     message: 'All OCR providers failed',
     meta: { err: String(docaiErr) },
    });
    throw new OCRProcessingError(
     'Alla OCR-tjänster misslyckades',
     'ALL_OCR_FAILED',
     { textractError: String(err), docaiError: String(docaiErr) }
    );
   }
  }

  // Confidence / graceful degradation
  const result = DeliveryNoteResultSchema.parse(parsed);
  const lowConfidence = result.ocrConfidence < 70;

  await logOcrStep({
   tenantId,
   correlationId,
   docType: 'delivery_note',
   stage: 'validated',
   meta: { lowConfidence },
  });

  // Persist to database
  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.getUser();

  const { data: deliveryNote, error: dbError } = await admin
   .from('delivery_notes')
   .insert({
    tenant_id: tenantId,
    file_path: storagePath,
    file_size_bytes: buffer.byteLength,
    mime_type: mimeType,
    original_filename: file.name,
    ocr_status: 'completed',
    ocr_provider: textractOk ? 'aws_textract' : 'google_document_ai',
    ocr_confidence: result.ocrConfidence,
    extracted_data: result,
    supplier_name: result.supplierName,
    delivery_date: result.deliveryDate,
    reference_number: result.referenceNumber,
    project_reference: result.projectReference,
    delivery_address: result.deliveryAddress,
    status: 'processed',
    created_by: user?.id,
   })
   .select('id')
   .single();

  if (dbError) {
   throw new Error(`Database error: ${dbError.message}`);
  }

  await logOcrStep({
   tenantId,
   correlationId,
   docType: 'delivery_note',
   stage: 'completed',
   filePath: storagePath,
   message: 'OCR completed',
  });

  const responsePayload = {
   success: true,
   correlationId,
   source: textractOk ? 'textract' : 'docai',
   lowConfidence,
   filePath: storagePath,
   deliveryNoteId: deliveryNote?.id,
   data: result,
  };

  // Idempotency store
  if (idemKey) {
   await storeIdempotency(
    tenantId,
    '/api/delivery-notes/process',
    idemKey,
    responsePayload
   );
  }

  return NextResponse.json(responsePayload, {
   status: lowConfidence ? 200 : 200,
  });
 } catch (err: any) {
  const human =
   err instanceof ValidationError
    ? 'Valideringen misslyckades för dokumentet'
    : err instanceof StorageError
    ? 'Det gick inte att lagra dokumentet'
    : err instanceof OCRProcessingError
    ? 'OCR-tjänsten är inte tillgänglig just nu'
    : 'Okänt fel vid OCR-bearbetning';

  const status =
   err instanceof ValidationError
    ? 400
    : err instanceof StorageError
    ? 500
    : err instanceof OCRProcessingError
    ? 503
    : 500;

  if (tenantId) {
   await logOcrStep({
    tenantId,
    correlationId,
    docType: 'delivery_note',
    stage: 'error',
    level: 'error',
    message: human,
    filePath: storagePath,
    meta: { err: String(err?.message ?? err) },
   }).catch(() => {});
  }

  return NextResponse.json(
   {
    success: false,
    error: human, // Swedish for user
    correlationId,
   },
   { status }
  );
 }
}

