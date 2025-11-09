// app/lib/storage/getSupplierInvoiceUrl.ts
import { createClient } from '@supabase/supabase-js'

export async function getSupplierInvoiceUrl(path: string, expiresIn = 60 * 10): Promise<string> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const srv = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  const { data, error } = await srv.storage.from('supplier_invoices').createSignedUrl(path, expiresIn)

  if (error) throw error

  return data.signedUrl
}

