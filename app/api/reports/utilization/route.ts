import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseSearchParams, apiSuccess, apiError } from '@/lib/api'

export const runtime = 'nodejs'

const UtilizationSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM').optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  standard_hours_per_day: z.coerce.number().default(8),
})

/**
 * GET /api/reports/utilization?period=2026-03
 * Hours per employee, billable vs non-billable, overtime analysis.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const params = parseSearchParams(req, UtilizationSchema)
    if (params.error) return params.error

    const { period, from, to, standard_hours_per_day } = params.data

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
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      dateFrom = `${y}-${m}-01`
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
      dateTo = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    }

    const admin = auth.admin

    // Fetch employees
    const { data: employees, error: empErr } = await admin
      .from('employees')
      .select('id, name')
      .eq('tenant_id', auth.tenantId)

    if (empErr) {
      console.error('Utilization employees error:', empErr)
      return apiError('Failed to fetch employees', 500)
    }

    // Fetch time entries
    const { data: timeEntries, error: teErr } = await admin
      .from('time_entries')
      .select('employee_id, hours, billable, date')
      .eq('tenant_id', auth.tenantId)
      .gte('date', dateFrom)
      .lte('date', dateTo)

    if (teErr) {
      console.error('Utilization time_entries error:', teErr)
      return apiError('Failed to fetch time entries', 500)
    }

    // Count working days in period (Mon-Fri)
    const workingDays = countWorkingDays(dateFrom, dateTo)
    const scheduledHours = workingDays * standard_hours_per_day

    // Aggregate per employee
    const empMap = new Map<string, { name: string; billable: number; nonBillable: number }>()

    for (const emp of employees ?? []) {
      empMap.set(emp.id as string, {
        name: emp.name as string,
        billable: 0,
        nonBillable: 0,
      })
    }

    for (const te of timeEntries ?? []) {
      const empId = te.employee_id as string
      if (!empMap.has(empId)) {
        empMap.set(empId, { name: empId, billable: 0, nonBillable: 0 })
      }
      const entry = empMap.get(empId)!
      const hours = Number(te.hours ?? 0)
      if (te.billable) {
        entry.billable += hours
      } else {
        entry.nonBillable += hours
      }
    }

    const rows = Array.from(empMap.entries()).map(([id, e]) => {
      const totalHours = e.billable + e.nonBillable
      const overtime = Math.max(0, totalHours - scheduledHours)
      const utilizationPercent =
        scheduledHours > 0 ? Math.round((e.billable / scheduledHours) * 10000) / 100 : 0

      return {
        employee_id: id,
        employee_name: e.name,
        billable_hours: Math.round(e.billable * 100) / 100,
        non_billable_hours: Math.round(e.nonBillable * 100) / 100,
        total_hours: Math.round(totalHours * 100) / 100,
        scheduled_hours: scheduledHours,
        overtime_hours: Math.round(overtime * 100) / 100,
        utilization_percent: utilizationPercent,
      }
    })

    rows.sort((a, b) => b.utilization_percent - a.utilization_percent)

    return apiSuccess({
      period: { from: dateFrom, to: dateTo },
      working_days: workingDays,
      standard_hours_per_day,
      rows,
      averages: {
        utilization_percent:
          rows.length > 0
            ? Math.round((rows.reduce((s, r) => s + r.utilization_percent, 0) / rows.length) * 100) / 100
            : 0,
        total_billable: rows.reduce((s, r) => s + r.billable_hours, 0),
        total_non_billable: rows.reduce((s, r) => s + r.non_billable_hours, 0),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/reports/utilization:', msg)
    return apiError('Internal server error', 500)
  }
}

function countWorkingDays(from: string, to: string): number {
  let count = 0
  const start = new Date(from)
  const end = new Date(to)
  const current = new Date(start)

  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }

  return count
}
