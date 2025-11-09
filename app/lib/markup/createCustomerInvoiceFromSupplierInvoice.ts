// app/lib/markup/createCustomerInvoiceFromSupplierInvoice.ts
import { createAdminClient } from '@/utils/supabase/admin'

export async function createCustomerInvoiceFromSupplierInvoice(
  invoiceId: string,
  tenantId: string
): Promise<{ customerInvoiceId: string }> {
  const admin = createAdminClient()

  const { data: supInv, error: invErr } = await admin
    .from('supplier_invoices')
    .select('id, tenant_id, project_id, invoice_number, amount_total, markup_total, currency, exchange_rate')
    .eq('tenant_id', tenantId)
    .eq('id', invoiceId)
    .maybeSingle()

  if (invErr || !supInv) {
    throw invErr || new Error('Leverantörsfaktura saknas')
  }

  // Hämta projekt och kund för kundfaktura
  const { data: proj } = await admin
    .from('projects')
    .select('id, client_id')
    .eq('tenant_id', tenantId)
    .eq('id', supInv.project_id)
    .maybeSingle()

  if (!proj?.client_id) {
    throw new Error('Projekt saknar kundkoppling')
  }

  const grossToBill = Number(supInv.amount_total || 0) + Number(supInv.markup_total || 0)

  // Skapa kundfaktura - anpassa fältnamn till er invoices-schema
  const { data: created, error: insErr } = await admin
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      project_id: supInv.project_id,
      client_id: proj.client_id,
      amount: grossToBill,
      status: 'draft',
      issue_date: new Date().toISOString().slice(0, 10),
      currency: supInv.currency ?? 'SEK',
      description: `Kostnader från leverantörsfaktura ${supInv.invoice_number || invoiceId}`
    })
    .select('id')
    .single()

  if (insErr) throw insErr

  // Get user ID
  const { data: { user } } = await admin.auth.getUser()

  await admin.from('supplier_invoice_history').insert({
    tenant_id: tenantId,
    supplier_invoice_id: invoiceId,
    action: 'converted',
    data: { customerInvoiceId: created.id },
    changed_by: user?.id || null
  })

  return { customerInvoiceId: created.id }
}

