// app/api/supplier-invoices/process/route.ts

/**
 * POST /api/supplier-invoices/process
 * Process supplier invoice with OCR and auto-matching
 * Based on GPT-5 + Deepseek + Gemini implementations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { logOcrStep } from '@/lib/ocr/logger';
import { runTextract } from '@/lib/ocr/clients/textract';
import { runGoogleDocAI } from '@/lib/ocr/clients/docai';
import { parseInvoiceFromTextract } from '@/lib/ocr/parsers/invoice';
import { InvoiceResultSchema } from '@/lib/ocr/schemas';
import {
  OCRProcessingError,
  StorageError,
  ValidationError,
} from '@/lib/ocr/errors';
import { uploadInvoiceFile } from '@/lib/storage/documents';
import { assertRateLimit } from '@/lib/rateLimit';
import { checkIdempotency, storeIdempotency } from '@/lib/idempotency';
import { MultiStageProjectMatcher } from '@/lib/ocr/matching/fuzzyMatcher';
import type { ProjectMatchResult } from '@/types/ocr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function newCorrelationId(): string {
  return crypto.randomUUID();
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
    await assertRateLimit(tenantId, '/api/supplier-invoices/process', 12);

    // Idempotency
    const idemKey = req.headers.get('idempotency-key');
    const cached = await checkIdempotency(
      tenantId,
      '/api/supplier-invoices/process',
      idemKey
    );
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }

    // Read multipart
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Filen saknas (form field "file")' },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/pdf';
    const bytes = new Uint8Array(await file.arrayBuffer());
    const buffer = Buffer.from(bytes);

    // Validate file size
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Filen är för stor (max 10MB)' },
        { status: 413 }
      );
    }

    // Validate file type
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: 'Ogiltig filtyp. Endast PDF och bilder tillåtna.' },
        { status: 400 }
      );
    }

    await logOcrStep({
      tenantId,
      correlationId,
      docType: 'invoice',
      stage: 'received',
      message: 'File received',
      meta: { mimeType, size: buffer.byteLength },
    });

    // Upload file
    const { path } = await uploadInvoiceFile(tenantId, buffer, mimeType).catch(
      (e) => {
        throw new StorageError('Uppladdning misslyckades', { err: String(e) });
      }
    );

    storagePath = path;

    await logOcrStep({
      tenantId,
      correlationId,
      docType: 'invoice',
      stage: 'uploaded',
      filePath: path,
    });

    // Run OCR with Textract QueriesConfig
    await logOcrStep({
      tenantId,
      correlationId,
      docType: 'invoice',
      stage: 'textract_started',
    });

    let textractOk = true;
    let parsed;
    let queryAnswers: Record<string, string> = {};

    try {
      // TODO: Implement Textract with QueriesConfig when AWS SDK is configured
      // For now, use basic extraction
      const tx = await runTextract(bytes, mimeType);
      await logOcrStep({
        tenantId,
        correlationId,
        docType: 'invoice',
        stage: 'textract_done',
        meta: { confidence: tx.modelConfidence },
      });

      parsed = parseInvoiceFromTextract(
        tx.blocks,
        tx.rawText,
        tx.modelConfidence,
        queryAnswers
      );
    } catch (err) {
      textractOk = false;
      await logOcrStep({
        tenantId,
        correlationId,
        docType: 'invoice',
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
          docType: 'invoice',
          stage: 'docai_done',
          meta: { confidence: da.confidence },
        });

        parsed = parseInvoiceFromTextract([], da.text, da.confidence, {});
      } catch (docaiErr) {
        throw new OCRProcessingError(
          'Alla OCR-tjänster misslyckades',
          'ALL_OCR_FAILED'
        );
      }
    }

    const result = InvoiceResultSchema.parse(parsed);

    await logOcrStep({
      tenantId,
      correlationId,
      docType: 'invoice',
      stage: 'validated',
    });

    // Auto-match to project
    await logOcrStep({
      tenantId,
      correlationId,
      docType: 'invoice',
      stage: 'matching_started',
    });

    const admin = createAdminClient();

    // Get active projects for matching
    const { data: projects } = await admin
      .from('projects')
      .select('id, name, project_number, external_reference, start_date, end_date, customer_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .or('end_date.is.null');

    const matcher = new MultiStageProjectMatcher();
    let projectMatch: ProjectMatchResult | null = null;

    if (projects && projects.length > 0) {
      projectMatch = await matcher.findBestMatch(
        {
          projectReference: result.projectReference,
          supplierName: result.supplierName,
          invoiceDate: result.invoiceDate,
          totalAmount: result.totalAmount,
        },
        tenantId,
        projects
      );
    }

    // Get or create supplier
    let supplierId: string | undefined;
    const { data: existingSupplier } = await admin
      .from('suppliers')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('name', result.supplierName)
      .maybeSingle();

    if (existingSupplier) {
      supplierId = existingSupplier.id;
    } else {
      // Create new supplier
      const { data: newSupplier } = await admin
        .from('suppliers')
        .insert({
          tenant_id: tenantId,
          name: result.supplierName,
          contact_email: result.supplierEmail,
          contact_phone: result.supplierPhone,
          is_active: true,
        })
        .select('id')
        .single();

      if (newSupplier) {
        supplierId = newSupplier.id;
      }
    }

    // Create invoice record
    const { data: { user } } = await admin.auth.getUser();

    const requiresManualReview =
      result.ocrConfidence < 75 || !projectMatch || projectMatch.confidence < 60;

    const { data: invoice, error: dbError } = await admin
      .from('supplier_invoices')
      .insert({
        tenant_id: tenantId,
        supplier_id: supplierId,
        project_id: projectMatch?.projectId || null,
        file_path: storagePath,
        file_size_bytes: buffer.byteLength,
        mime_type: mimeType,
        original_filename: file.name,
        ocr_status: 'completed',
        ocr_provider: textractOk ? 'aws_textract' : 'google_document_ai',
        ocr_confidence: result.ocrConfidence,
        extracted_data: result,
        invoice_number: result.invoiceNumber,
        supplier_invoice_date: result.invoiceDate,
        supplier_due_date: result.dueDate,
        subtotal: result.subtotal,
        tax_rate: result.vatRate,
        tax_amount: result.vatAmount,
        total_amount: result.totalAmount,
        currency: result.currency,
        line_items: result.lineItems,
        match_confidence: projectMatch?.confidence || null,
        match_reason: projectMatch?.matchReason || null,
        match_metadata: projectMatch
          ? {
              projectId: projectMatch.projectId,
              projectName: projectMatch.projectName,
              confidence: projectMatch.confidence,
              stage: projectMatch.stage,
            }
          : null,
        requires_manual_review: requiresManualReview,
        status: requiresManualReview ? 'pending_approval' : 'pending_approval',
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
      docType: 'invoice',
      stage: 'completed',
      filePath: storagePath,
      message: 'Invoice processed and matched',
    });

    const responsePayload = {
      success: true,
      correlationId,
      source: textractOk ? 'textract' : 'docai',
      lowConfidence: result.ocrConfidence < 70,
      filePath: storagePath,
      invoiceId: invoice?.id,
      requiresManualReview,
      projectMatch: projectMatch
        ? {
            projectId: projectMatch.projectId,
            projectName: projectMatch.projectName,
            confidence: projectMatch.confidence,
            reason: projectMatch.matchReason,
          }
        : null,
      data: result,
    };

    // Idempotency store
    if (idemKey) {
      await storeIdempotency(
        tenantId,
        '/api/supplier-invoices/process',
        idemKey,
        responsePayload
      );
    }

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: any) {
    const human =
      err instanceof ValidationError
        ? 'Valideringen misslyckades för fakturan'
        : err instanceof StorageError
        ? 'Det gick inte att lagra fakturan'
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
        docType: 'invoice',
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
        error: human,
        correlationId,
      },
      { status }
    );
  }
}

