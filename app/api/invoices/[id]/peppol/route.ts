import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { sendInvoice } from '@/lib/peppol/client'
import { mapToPeppolInvoice } from '@/lib/peppol/mapper'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error
    const { id } = await params

    // Fetch invoice with client and line items
    const { data: invoice, error: invError } = await auth.admin
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (invError || !invoice) return apiError('Invoice not found', 404)

    // Get tenant info for supplier data
    const { data: tenant, error: tenantError } = await auth.admin
      .from('tenants')
      .select('name, org_number, vat_number, address, city, zip_code')
      .eq('id', auth.tenantId)
      .single()

    if (tenantError || !tenant) return apiError('Tenant not found', 404)

    // Map to PEPPOL format
    const peppolInvoice = mapToPeppolInvoice({
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      currency: 'SEK',
      supplier: {
        name: tenant.name,
        orgNumber: tenant.org_number,
        vatNumber: tenant.vat_number || `SE${tenant.org_number}01`,
        address: { street: tenant.address, city: tenant.city, zip: tenant.zip_code, country: 'SE' },
      },
      customer: {
        name: invoice.client.name,
        orgNumber: invoice.client.org_number,
        vatNumber: invoice.client.vat_number,
        address: {
          street: invoice.client.address,
          city: invoice.client.city,
          zip: invoice.client.zip_code,
          country: 'SE',
        },
      },
      lines: invoice.items.map((item: Record<string, unknown>) => ({
        description: item.description as string,
        quantity: item.quantity as number,
        unitPrice: item.unit_price as number,
        vatPercent: (item.vat_percent as number) ?? 25,
        unitCode: (item.unit_code as string) ?? 'EA',
      })),
    })

    // Send via PEPPOL
    const result = await sendInvoice(peppolInvoice as unknown as Record<string, unknown>)

    // Update invoice status
    await auth.admin.from('invoices').update({
      peppol_status: 'sent',
      peppol_id: result.id,
    }).eq('id', id)

    return apiSuccess({ peppolId: result.id, status: 'sent' })
  } catch (error) {
    return handleRouteError(error)
  }
}
