import { createAdminClient } from '@/utils/supabase/admin'

export async function generateQuoteNumber(tenantId: string): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('generate_quote_number', { p_tenant: tenantId })
  if (error) throw error
  return data as string
}

