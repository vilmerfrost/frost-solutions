import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Papa from 'papaparse'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError } from '@/lib/api'

export const runtime = 'nodejs'

const ExportSchema = z.object({
  reportType: z.enum(['profitability', 'utilization', 'cashflow']),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM').optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  groupBy: z.enum(['project', 'client', 'employee']).optional(),
  months: z.coerce.number().min(1).max(12).optional(),
  format: z.enum(['json', 'csv']).default('json'),
})

/**
 * POST /api/reports/export
 * Generate a report and return as JSON or CSV.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, ExportSchema)
    if (body.error) return body.error

    const { reportType, period, from, to, groupBy, months, format } = body.data

    // Build the internal API URL to fetch the report data
    const baseUrl = req.nextUrl.origin

    let reportUrl: string
    const queryParams = new URLSearchParams()

    switch (reportType) {
      case 'profitability':
        reportUrl = `${baseUrl}/api/reports/profitability`
        if (period) queryParams.set('period', period)
        if (from) queryParams.set('from', from)
        if (to) queryParams.set('to', to)
        if (groupBy) queryParams.set('groupBy', groupBy)
        break
      case 'utilization':
        reportUrl = `${baseUrl}/api/reports/utilization`
        if (period) queryParams.set('period', period)
        if (from) queryParams.set('from', from)
        if (to) queryParams.set('to', to)
        break
      case 'cashflow':
        reportUrl = `${baseUrl}/api/reports/cashflow`
        if (months) queryParams.set('months', String(months))
        break
    }

    const qs = queryParams.toString()
    const fullUrl = qs ? `${reportUrl}?${qs}` : reportUrl

    // Forward cookies for auth
    const cookieHeader = req.headers.get('cookie') ?? ''
    const reportRes = await fetch(fullUrl, {
      headers: { cookie: cookieHeader },
    })

    if (!reportRes.ok) {
      return apiError('Failed to generate report', reportRes.status)
    }

    const reportJson = (await reportRes.json()) as { success: boolean; data: Record<string, unknown> }

    if (!reportJson.success) {
      return apiError('Report generation failed', 500)
    }

    // Return JSON format
    if (format === 'json') {
      return apiSuccess(reportJson.data)
    }

    // CSV format — flatten the rows
    const data = reportJson.data
    let rows: Record<string, unknown>[] = []

    if ('rows' in data && Array.isArray(data.rows)) {
      rows = data.rows as Record<string, unknown>[]
    } else if ('months' in data && Array.isArray(data.months)) {
      rows = data.months as Record<string, unknown>[]
    }

    if (rows.length === 0) {
      return new NextResponse('No data', {
        status: 200,
        headers: { 'Content-Type': 'text/csv' },
      })
    }

    const csv = Papa.unparse(rows)
    const filename = `${reportType}_report_${period ?? new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in POST /api/reports/export:', msg)
    return apiError('Internal server error', 500)
  }
}
