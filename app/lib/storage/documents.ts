// app/lib/storage/documents.ts

/**
 * Document Storage Helpers
 * Based on GPT-5 implementation
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { StorageError } from '../ocr/errors';

/**
 * Upload delivery note file to Supabase Storage
 */
export async function uploadDeliveryNoteFile(
  tenantId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ path: string }> {
  try {
    const admin = createAdminClient();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `documents/delivery-notes/${tenantId}/${ts}.pdf`;

    const { error } = await admin.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new StorageError(`Storage upload failed: ${error.message}`, {
        path,
        error: error.message,
      });
    }

    return { path };
  } catch (error: any) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError('Failed to upload file', { err: String(error) });
  }
}

/**
 * Upload invoice file to Supabase Storage
 */
export async function uploadInvoiceFile(
  tenantId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ path: string }> {
  try {
    const admin = createAdminClient();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `documents/supplier-invoices/${tenantId}/${ts}.pdf`;

    const { error } = await admin.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new StorageError(`Storage upload failed: ${error.message}`, {
        path,
        error: error.message,
      });
    }

    return { path };
  } catch (error: any) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError('Failed to upload file', { err: String(error) });
  }
}

