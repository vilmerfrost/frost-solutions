import { createClient } from '@supabase/supabase-js';

/**
 * Uploads payroll export file to Supabase Storage and returns signed URL
 */
export async function uploadAndSignExport(
  tenantId: string, 
  fileName: string, 
  buf: Buffer, 
  contentType: string
): Promise<{ filePath: string; signedUrl: string }> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const srv = createClient(url, key, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });

  const path = `${tenantId}/${Date.now()}_${fileName}`;
  
  const { error: upErr } = await srv.storage
    .from('payroll_exports')
    .upload(path, buf, {
      contentType,
      upsert: false
    });

  if (upErr) {
    throw new Error(`Failed to upload payroll export: ${upErr.message}`);
  }

  // Create signed URL (valid for 10 minutes)
  const { data: signed, error: sErr } = await srv.storage
    .from('payroll_exports')
    .createSignedUrl(path, 60 * 10);

  if (sErr || !signed) {
    throw new Error(`Failed to create signed URL: ${sErr?.message || 'Unknown error'}`);
  }

  return { filePath: path, signedUrl: signed.signedUrl };
}

