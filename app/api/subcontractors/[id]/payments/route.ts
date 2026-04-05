import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const recordPaymentSchema = z.object({
  supplier_invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z.string().max(100).optional(),
  reference: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * GET /api/subcontractors/[id]/payments
 * List payment status (invoiced, paid, outstanding) for a subcontractor.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: subcontractorId } = await params

    // Verify subcontractor exists
    const { data: subcontractor } = await auth.admin
      .from('subcontractors')
      .select('id, company_name')
      .eq('id', subcontractorId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!subcontractor) {
      return apiError('Subcontractor not found', 404)
    }

    // Fetch supplier invoices for this subcontractor
    const { data: invoices, error: invErr } = await auth.admin
      .from('supplier_invoices')
      .select('id, invoice_number, total_amount, status, invoice_date, due_date, project_id, metadata')
      .eq('tenant_id', auth.tenantId)
      .eq('supplier_id', subcontractorId)
      .order('invoice_date', { ascending: false })

    if (invErr) {
      return apiError('Failed to fetch invoices', 500)
    }

    const allInvoices = invoices ?? []

    // Calculate totals
    let totalInvoiced = 0
    let totalPaid = 0
    let totalOutstanding = 0

    const enrichedInvoices = allInvoices.map((inv) => {
      const amount = Number(inv.total_amount ?? 0)
      const meta = (inv.metadata as Record<string, unknown>) ?? {}
      const payments = (meta.payments as Array<Record<string, unknown>>) ?? []
      const paidAmount = payments.reduce(
        (sum, p) => sum + Number((p as Record<string, unknown>).amount ?? 0),
        0
      )
      const outstanding = Math.max(0, amount - paidAmount)

      totalInvoiced += amount
      totalPaid += paidAmount
      totalOutstanding += outstanding

      return {
        ...inv,
        invoiced_amount: amount,
        paid_amount: Math.round(paidAmount * 100) / 100,
        outstanding_amount: Math.round(outstanding * 100) / 100,
        payment_status: outstanding <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
        payments,
      }
    })

    return apiSuccess({
      subcontractor: {
        id: subcontractor.id,
        company_name: subcontractor.company_name,
      },
      invoices: enrichedInvoices,
      totals: {
        invoiced: Math.round(totalInvoiced * 100) / 100,
        paid: Math.round(totalPaid * 100) / 100,
        outstanding: Math.round(totalOutstanding * 100) / 100,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * POST /api/subcontractors/[id]/payments
 * Record a payment against a subcontractor invoice.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: subcontractorId } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = recordPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    // Verify the invoice belongs to this subcontractor and tenant
    const { data: invoice, error: invErr } = await auth.admin
      .from('supplier_invoices')
      .select('id, total_amount, metadata')
      .eq('id', parsed.data.supplier_invoice_id)
      .eq('supplier_id', subcontractorId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (invErr || !invoice) {
      return apiError('Supplier invoice not found', 404)
    }

    // Add payment to metadata
    const meta = (invoice.metadata as Record<string, unknown>) ?? {}
    const payments = (meta.payments as Array<Record<string, unknown>>) ?? []

    const payment = {
      id: crypto.randomUUID(),
      amount: parsed.data.amount,
      payment_date: parsed.data.payment_date,
      payment_method: parsed.data.payment_method ?? null,
      reference: parsed.data.reference ?? null,
      notes: parsed.data.notes ?? null,
      recorded_by: auth.user.id,
      recorded_at: new Date().toISOString(),
    }

    payments.push(payment)

    // Check if fully paid
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number((p as Record<string, unknown>).amount ?? 0),
      0
    )
    const invoiceAmount = Number(invoice.total_amount ?? 0)
    const newStatus = totalPaid >= invoiceAmount ? 'paid' : 'partial'

    const { error: updateErr } = await auth.admin
      .from('supplier_invoices')
      .update({
        status: newStatus,
        metadata: { ...meta, payments },
      })
      .eq('id', invoice.id)

    if (updateErr) {
      return apiError('Failed to record payment', 500)
    }

    return apiSuccess({
      payment,
      invoice_status: newStatus,
      total_paid: Math.round(totalPaid * 100) / 100,
      outstanding: Math.round(Math.max(0, invoiceAmount - totalPaid) * 100) / 100,
    }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
