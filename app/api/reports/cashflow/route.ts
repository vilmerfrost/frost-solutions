import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseSearchParams, apiSuccess, apiError } from '@/lib/api'

export const runtime = 'nodejs'

const CashflowSchema = z.object({
  months: z.coerce.number().min(1).max(12).default(3),
})

/**
 * GET /api/reports/cashflow?months=3
 * Outstanding invoices (inflow), payroll (outflow), supplier invoices (outflow), net per month.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const params = parseSearchParams(req, CashflowSchema)
    if (params.error) return params.error

    const { months } = params.data
    const admin = auth.admin

    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endMonth = new Date(now.getFullYear(), now.getMonth() + months, 0)

    const dateFrom = startMonth.toISOString().slice(0, 10)
    const dateTo = endMonth.toISOString().slice(0, 10)

    // Outstanding invoices (expected inflow by due_date)
    const { data: invoices, error: invErr } = await admin
      .from('invoices')
      .select('id, total_amount, due_date, status')
      .eq('tenant_id', auth.tenantId)
      .in('status', ['sent', 'unpaid', 'overdue', 'pending'])
      .gte('due_date', dateFrom)
      .lte('due_date', dateTo)

    if (invErr) {
      console.error('Cashflow invoices error:', invErr)
      return apiError('Failed to fetch invoices', 500)
    }

    // Supplier invoices (outflow by due_date)
    const { data: supplierInvoices, error: siErr } = await admin
      .from('supplier_invoices')
      .select('id, total_amount, due_date, status')
      .eq('tenant_id', auth.tenantId)
      .in('status', ['pending', 'unpaid', 'approved'])
      .gte('due_date', dateFrom)
      .lte('due_date', dateTo)

    if (siErr) {
      console.error('Cashflow supplier_invoices error:', siErr)
      return apiError('Failed to fetch supplier invoices', 500)
    }

    // Active employees for payroll estimate
    const { data: employees, error: empErr } = await admin
      .from('employees')
      .select('id, monthly_salary')
      .eq('tenant_id', auth.tenantId)
      .eq('active', true)

    if (empErr) {
      console.error('Cashflow employees error:', empErr)
      return apiError('Failed to fetch employees', 500)
    }

    const monthlyPayroll = (employees ?? []).reduce(
      (sum, emp) => sum + Number(emp.monthly_salary ?? 0),
      0
    )

    // Build monthly buckets
    const monthlyData: Array<{
      month: string
      inflow: number
      outflow_suppliers: number
      outflow_payroll: number
      net: number
    }> = []

    for (let i = 0; i < months; i++) {
      const mDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthKey = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`

      // Inflow: invoices due this month
      const inflow = (invoices ?? [])
        .filter((inv) => (inv.due_date as string)?.startsWith(monthKey))
        .reduce((sum, inv) => sum + Number(inv.total_amount ?? 0), 0)

      // Outflow: supplier invoices due this month
      const outflowSuppliers = (supplierInvoices ?? [])
        .filter((si) => (si.due_date as string)?.startsWith(monthKey))
        .reduce((sum, si) => sum + Number(si.total_amount ?? 0), 0)

      const net = inflow - outflowSuppliers - monthlyPayroll

      monthlyData.push({
        month: monthKey,
        inflow: Math.round(inflow * 100) / 100,
        outflow_suppliers: Math.round(outflowSuppliers * 100) / 100,
        outflow_payroll: Math.round(monthlyPayroll * 100) / 100,
        net: Math.round(net * 100) / 100,
      })
    }

    return apiSuccess({
      period: { from: dateFrom, to: dateTo },
      monthly_payroll_estimate: Math.round(monthlyPayroll * 100) / 100,
      months: monthlyData,
      totals: {
        inflow: monthlyData.reduce((s, m) => s + m.inflow, 0),
        outflow: monthlyData.reduce((s, m) => s + m.outflow_suppliers + m.outflow_payroll, 0),
        net: monthlyData.reduce((s, m) => s + m.net, 0),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/reports/cashflow:', msg)
    return apiError('Internal server error', 500)
  }
}
