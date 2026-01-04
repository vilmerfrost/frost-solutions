// app/lib/markup/applyInvoiceMarkup.ts
import { createAdminClient } from '@/utils/supabase/admin'
import { calculateInvoiceMarkup } from './calculateInvoiceMarkup'

export async function applyMarkupToInvoice(
 invoiceId: string,
 projectId: string | null,
 tenantId: string,
 changedBy?: string
) {
 const admin = createAdminClient()

 const { totalMarkup } = await calculateInvoiceMarkup(invoiceId, projectId, tenantId)

 const { error } = await admin
  .from('supplier_invoices')
  .update({ markup_total: totalMarkup })
  .eq('tenant_id', tenantId)
  .eq('id', invoiceId)

 if (error) throw error

 // Get user ID if not provided
 let userId: string | undefined = changedBy
 if (!userId) {
  const { data: { user } } = await admin.auth.getUser()
  userId = user?.id || undefined
 }

 await admin.from('supplier_invoice_history').insert({
  tenant_id: tenantId,
  supplier_invoice_id: invoiceId,
  action: 'markup_applied',
  data: { totalMarkup },
  changed_by: userId
 })

 return totalMarkup
}

