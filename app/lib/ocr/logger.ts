// app/lib/ocr/logger.ts

/**
 * OCR Processing Logger
 * Logs all OCR operations for audit trail
 * Based on GPT-5 implementation
 */

import { createAdminClient } from '@/utils/supabase/admin';
import type { OCRProcessingLog } from '@/types/ocr';

export async function logOcrStep(params: {
  tenantId: string;
  correlationId: string;
  docType: 'delivery_note' | 'invoice' | 'form';
  stage: string;
  level?: 'info' | 'warn' | 'error';
  message?: string;
  filePath?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();

    // Use app schema if it exists, otherwise public
    const schema = 'app';
    
    await admin
      .schema(schema)
      .from('ocr_processing_logs')
      .insert({
        tenant_id: params.tenantId,
        correlation_id: params.correlationId,
        doc_type: params.docType,
        stage: params.stage,
        level: params.level ?? 'info',
        message: params.message ?? null,
        file_path: params.filePath ?? null,
        meta: params.meta ?? null,
      });
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('[OCR Logger] Failed to log step:', error);
  }
}

