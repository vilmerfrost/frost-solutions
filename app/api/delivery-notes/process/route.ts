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

 console.log(`[delivery-notes][${correlationId}] === START ===`);

 try {
  // Step 1: Auth / tenant
  console.log(`[delivery-notes][${correlationId}] Step 1: Checking auth...`);
  tenantId = await getTenantId();
  if (!tenantId) {
   console.log(`[delivery-notes][${correlationId}] ERROR: No tenant found`);
   return NextResponse.json(
    { success: false, error: 'Ingen tenant hittades' },
    { status: 401 }
   );
  }
  console.log(`[delivery-notes][${correlationId}] Step 1: Auth OK`);

  // Step 2: Rate limit
  console.log(`[delivery-notes][${correlationId}] Step 2: Checking rate limit...`);
  await assertRateLimit(tenantId, '/api/delivery-notes/process', 12);
  console.log(`[delivery-notes][${correlationId}] Step 2: Rate limit OK`);

  // Step 3: Idempotency
  console.log(`[delivery-notes][${correlationId}] Step 3: Checking idempotency...`);
  const idemKey = req.headers.get('idempotency-key');
  const cached = await checkIdempotency(
   tenantId,
   '/api/delivery-notes/process',
   idemKey
  );
  if (cached) {
   console.log(`[delivery-notes][${correlationId}] Step 3: Returning cached response`);
   return NextResponse.json(cached, { status: 200 });
  }
  console.log(`[delivery-notes][${correlationId}] Step 3: No cache, proceeding`);

  // Step 4: Read multipart
  console.log(`[delivery-notes][${correlationId}] Step 4: Reading form data...`);
  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) {
   console.log(`[delivery-notes][${correlationId}] ERROR: No file in form data`);
   return badRequest('Filen saknas (form field "file")');
  }

  const mimeType = file.type || 'application/pdf';
  const bytes = new Uint8Array(await file.arrayBuffer());
  const buffer = Buffer.from(bytes);
  
  console.log(`[delivery-notes][${correlationId}] Step 4: File received - type: ${mimeType}, size: ${buffer.byteLength} bytes`);

  // Step 5: Validate file size (max 10MB)
  console.log(`[delivery-notes][${correlationId}] Step 5: Validating file...`);
  if (buffer.byteLength > 10 * 1024 * 1024) {
   console.log(`[delivery-notes][${correlationId}] ERROR: File too large`);
   return NextResponse.json(
    { success: false, error: 'Filen är för stor (max 10MB)' },
    { status: 413 }
   );
  }

  // Step 6: Validate file type
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(mimeType)) {
   console.log(`[delivery-notes][${correlationId}] ERROR: Invalid file type: ${mimeType}`);
   return badRequest('Ogiltig filtyp. Endast PDF och bilder tillåtna.');
  }
  console.log(`[delivery-notes][${correlationId}] Step 5-6: Validation OK`);

  // Step 7: Store original file
  console.log(`[delivery-notes][${correlationId}] Step 7: Uploading file to storage...`);
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
   console.error(`[delivery-notes][${correlationId}] ERROR: Upload failed:`, e instanceof Error ? e.message : 'Unknown error');
   throw new StorageError('Uppladdning misslyckades', { err: String(e) });
  });

  storagePath = path;
  console.log(`[delivery-notes][${correlationId}] Step 7: Upload OK`);

  await logOcrStep({
   tenantId,
   correlationId,
   docType: 'delivery_note',
   stage: 'uploaded',
   filePath: path,
  });

  // Step 8: Run Textract with retry
  console.log(`[delivery-notes][${correlationId}] Step 8: Running Textract OCR...`);
  await logOcrStep({
   tenantId,
   correlationId,
   docType: 'delivery_note',
   stage: 'textract_started',
  });

  let textractOk = true;
  let parsed;
  let textractError: string | null = null;

  try {
   const tx = await runTextract(bytes, mimeType);
   console.log(`[delivery-notes][${correlationId}] Step 8: Textract OK, confidence: ${tx.modelConfidence}`);
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
   console.log(`[delivery-notes][${correlationId}] Step 8: Parsing OK`);
  } catch (err) {
   textractOk = false;
   textractError = err instanceof Error ? err.message : 'Unknown error';
   console.log(`[delivery-notes][${correlationId}] Step 8: Textract failed, trying DocAI...`);
   await logOcrStep({
    tenantId,
    correlationId,
    docType: 'delivery_note',
    stage: 'textract_failed',
    level: 'warn',
    message: 'Textract failed, trying DocAI',
    meta: { err: textractError },
   });
  }

  // Step 9: Fallback DocAI
  if (!parsed) {
   console.log(`[delivery-notes][${correlationId}] Step 9: Running Google DocAI fallback...`);
   try {
    const da = await runGoogleDocAI(bytes, mimeType);
    console.log(`[delivery-notes][${correlationId}] Step 9: DocAI OK, confidence: ${da.confidence}`);
    await logOcrStep({
     tenantId,
     correlationId,
     docType: 'delivery_note',
     stage: 'docai_done',
     meta: { confidence: da.confidence },
    });

    // Reuse parser (it can handle text-only input)
    parsed = parseDeliveryNoteFromTextract([], da.text, da.confidence);
    console.log(`[delivery-notes][${correlationId}] Step 9: Parsing OK`);
   } catch (docaiErr) {
    console.error(`[delivery-notes][${correlationId}] ERROR: All OCR providers failed`);
    await logOcrStep({
     tenantId,
     correlationId,
     docType: 'delivery_note',
     stage: 'docai_failed',
     level: 'error',
     message: 'All OCR providers failed',
     meta: { err: docaiErr instanceof Error ? docaiErr.message : 'Unknown error' },
    });
    throw new OCRProcessingError(
     'Alla OCR-tjänster misslyckades',
     'ALL_OCR_FAILED',
     { textractError: textractError ?? 'N/A', docaiError: docaiErr instanceof Error ? docaiErr.message : 'Unknown error' }
    );
   }
  }

  // Step 10: Confidence / graceful degradation
  console.log(`[delivery-notes][${correlationId}] Step 10: Validating parsed data...`);
  const result = DeliveryNoteResultSchema.parse(parsed);
  const lowConfidence = result.ocrConfidence < 70;
  console.log(`[delivery-notes][${correlationId}] Step 10: Validation OK, confidence: ${result.ocrConfidence}, lowConfidence: ${lowConfidence}`);

  await logOcrStep({
   tenantId,
   correlationId,
   docType: 'delivery_note',
   stage: 'validated',
   meta: { lowConfidence },
  });

  // Step 11: Persist to database
  console.log(`[delivery-notes][${correlationId}] Step 11: Saving to database...`);
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
   console.error(`[delivery-notes][${correlationId}] ERROR: Database save failed: ${dbError.code}`);
   throw new Error(`Database error: ${dbError.message}`);
  }

  console.log(`[delivery-notes][${correlationId}] Step 11: Database save OK`);

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

  console.log(`[delivery-notes][${correlationId}] === SUCCESS ===`);
  return NextResponse.json(responsePayload, {
   status: lowConfidence ? 200 : 200,
  });
 } catch (err: any) {
  const errorType = err?.constructor?.name || 'UnknownError';
  const errorCode = err instanceof ValidationError ? 'VALIDATION_ERROR'
   : err instanceof StorageError ? 'STORAGE_ERROR'
   : err instanceof OCRProcessingError ? 'OCR_ERROR'
   : 'UNKNOWN_ERROR';

  console.error(`[delivery-notes][${correlationId}] === ERROR ===`);
  console.error(`[delivery-notes][${correlationId}] Type: ${errorType}`);
  console.error(`[delivery-notes][${correlationId}] Code: ${errorCode}`);
  console.error(`[delivery-notes][${correlationId}] Message: ${err?.message || 'No message'}`);

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
