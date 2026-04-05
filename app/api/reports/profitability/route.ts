import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseSearchParams, apiSuccess, apiError } from '@/lib/api'
import { callOpenRouter } from '@/lib/ai/openrouter'

export const runtime = 'nodejs'

const ProfitabilitySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM').optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  groupBy: z.enum(['project', 'client', 'employee']).default('project'),
})

/**
 * GET /api/reports/profitability?period=2026-03&groupBy=project
 * Revenue vs costs per project/client/employee with margins.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const params = parseSearchParams(req, ProfitabilitySchema)
    if (params.error) return params.error

    const { period, from, to, groupBy } = params.data

    // Determine date range
    let dateFrom: string
    let dateTo: string

    if (period) {
      dateFrom = `${period}-01`
      const [y, m] = period.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      dateTo = `${period}-${String(lastDay).padStart(2, '0')}`
    } else if (from && to) {
      dateFrom = from
      dateTo = to
    } else {
      // Default: current month
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      dateFrom = `${y}-${m}-01`
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
      dateTo = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    }

    const admin = auth.admin

    // Fetch invoices for revenue
    const { data: invoices, error: invErr } = await admin
      .from('invoices')
      .select('id, project_id, client_id, total_amount, invoice_date')
      .eq('tenant_id', auth.tenantId)
      .gte('invoice_date', dateFrom)
      .lte('invoice_date', dateTo)

    if (invErr) {
      console.error('Profitability invoices error:', invErr)
      return apiError('Failed to fetch invoices', 500)
    }

    // Fetch time entries for labor costs
    const { data: timeEntries, error: teErr } = await admin
      .from('time_entries')
      .select('id, project_id, employee_id, hours, hourly_rate, date')
      .eq('tenant_id', auth.tenantId)
      .gte('date', dateFrom)
      .lte('date', dateTo)

    if (teErr) {
      console.error('Profitability time_entries error:', teErr)
      return apiError('Failed to fetch time entries', 500)
    }

    // Fetch supplier invoices for material costs
    const { data: supplierInvoices, error: siErr } = await admin
      .from('supplier_invoices')
      .select('id, project_id, total_amount, invoice_date')
      .eq('tenant_id', auth.tenantId)
      .gte('invoice_date', dateFrom)
      .lte('invoice_date', dateTo)

    if (siErr) {
      console.error('Profitability supplier_invoices error:', siErr)
      return apiError('Failed to fetch supplier invoices', 500)
    }

    // Aggregate by groupBy dimension
    const groups = new Map<string, { revenue: number; laborCost: number; materialCost: number }>()

    const getGroupKey = (row: Record<string, unknown>): string => {
      if (groupBy === 'project') return (row.project_id as string) ?? 'unassigned'
      if (groupBy === 'client') return (row.client_id as string) ?? 'unassigned'
      if (groupBy === 'employee') return (row.employee_id as string) ?? 'unassigned'
      return 'all'
    }

    const ensureGroup = (key: string) => {
      if (!groups.has(key)) groups.set(key, { revenue: 0, laborCost: 0, materialCost: 0 })
      return groups.get(key)!
    }

    // Revenue from invoices
    for (const inv of invoices ?? []) {
      const key = getGroupKey(inv as Record<string, unknown>)
      ensureGroup(key).revenue += Number(inv.total_amount ?? 0)
    }

    // Labor costs from time entries
    for (const te of timeEntries ?? []) {
      const key = getGroupKey(te as Record<string, unknown>)
      const cost = Number(te.hours ?? 0) * Number(te.hourly_rate ?? 0)
      ensureGroup(key).laborCost += cost
    }

    // Material costs from supplier invoices
    for (const si of supplierInvoices ?? []) {
      const key = getGroupKey(si as Record<string, unknown>)
      ensureGroup(key).materialCost += Number(si.total_amount ?? 0)
    }

    // Build results
    const results = Array.from(groups.entries()).map(([key, g]) => {
      const totalCost = g.laborCost + g.materialCost
      const margin = g.revenue - totalCost
      const marginPercent = g.revenue > 0 ? Math.round((margin / g.revenue) * 10000) / 100 : 0

      return {
        [groupBy]: key,
        revenue: Math.round(g.revenue * 100) / 100,
        labor_cost: Math.round(g.laborCost * 100) / 100,
        material_cost: Math.round(g.materialCost * 100) / 100,
        total_cost: Math.round(totalCost * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        margin_percent: marginPercent,
      }
    })

    // Sort by margin descending
    results.sort((a, b) => b.margin - a.margin)

    const totals = {
      revenue: results.reduce((s, r) => s + r.revenue, 0),
      total_cost: results.reduce((s, r) => s + r.total_cost, 0),
      margin: results.reduce((s, r) => s + r.margin, 0),
    }

    // AI predictions (optional — do not fail the report if AI call fails)
    let predictions: string | null = null
    try {
      const systemPrompt = 'Du ar en svensk byggekonom. Baserat pa denna projektdata, ge en kort prediktion om lonsamhetsrisk och rekommendationer. Svara pa svenska, max 300 ord.'
      const userPrompt = JSON.stringify({
        period: { from: dateFrom, to: dateTo },
        group_by: groupBy,
        rows: results.slice(0, 20), // Limit to avoid token overflow
        totals,
      })

      predictions = await callOpenRouter(systemPrompt, userPrompt, {
        maxTokens: 1024,
      })
    } catch (aiErr) {
      console.warn('AI predictions failed (non-critical):', aiErr instanceof Error ? aiErr.message : String(aiErr))
    }

    return apiSuccess({
      period: { from: dateFrom, to: dateTo },
      group_by: groupBy,
      rows: results,
      totals,
      ...(predictions ? { predictions } : {}),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/reports/profitability:', msg)
    return apiError('Internal server error', 500)
  }
}
