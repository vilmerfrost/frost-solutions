import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getResend, fromAddress } from '@/utils/supabase/resend'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * GET /api/cron/monthly-reports
 * Runs on the 1st of each month at 08:00.
 * Generates profitability + utilization summary per tenant and emails the admin.
 */
export async function GET(req: Request) {
  try {
    // Auth: CRON_SECRET
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const resend = getResend()
    const from = fromAddress()

    // Determine previous month date range
    const now = new Date()
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const month = now.getMonth() === 0 ? 12 : now.getMonth() // 1-indexed
    const monthStr = String(month).padStart(2, '0')
    const dateFrom = `${year}-${monthStr}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const dateTo = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`
    const periodLabel = `${year}-${monthStr}`

    // Get all active tenants
    const { data: tenants, error: tenantErr } = await admin
      .from('tenants')
      .select('id, name, owner_email')

    if (tenantErr) {
      console.error('Monthly reports: failed to fetch tenants', tenantErr)
      return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const tenant of tenants ?? []) {
      try {
        if (!tenant.owner_email) continue

        // Revenue: invoices
        const { data: invoices } = await admin
          .from('invoices')
          .select('total_amount')
          .eq('tenant_id', tenant.id)
          .gte('invoice_date', dateFrom)
          .lte('invoice_date', dateTo)

        const revenue = (invoices ?? []).reduce(
          (sum, inv) => sum + Number(inv.total_amount ?? 0),
          0
        )

        // Labor costs: time entries
        const { data: timeEntries } = await admin
          .from('time_entries')
          .select('hours, hourly_rate')
          .eq('tenant_id', tenant.id)
          .gte('date', dateFrom)
          .lte('date', dateTo)

        const laborCost = (timeEntries ?? []).reduce(
          (sum, te) => sum + Number(te.hours ?? 0) * Number(te.hourly_rate ?? 0),
          0
        )
        const totalHours = (timeEntries ?? []).reduce(
          (sum, te) => sum + Number(te.hours ?? 0),
          0
        )

        // Material costs: supplier invoices
        const { data: supplierInvoices } = await admin
          .from('supplier_invoices')
          .select('total_amount')
          .eq('tenant_id', tenant.id)
          .gte('invoice_date', dateFrom)
          .lte('invoice_date', dateTo)

        const materialCost = (supplierInvoices ?? []).reduce(
          (sum, si) => sum + Number(si.total_amount ?? 0),
          0
        )

        const totalCost = laborCost + materialCost
        const margin = revenue - totalCost
        const marginPercent = revenue > 0 ? Math.round((margin / revenue) * 100) : 0

        // Employee count
        const { count: employeeCount } = await admin
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'active')

        // Utilization: hours / (employees * working days * 8h)
        const workingDays = countWorkingDays(year, month)
        const capacity = (employeeCount ?? 0) * workingDays * 8
        const utilization = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0

        // Build email
        const html = buildReportEmail({
          tenantName: tenant.name,
          period: periodLabel,
          revenue,
          laborCost,
          materialCost,
          totalCost,
          margin,
          marginPercent,
          totalHours,
          employeeCount: employeeCount ?? 0,
          utilization,
        })

        await resend.emails.send({
          from,
          to: tenant.owner_email,
          subject: `Manadsrapport ${periodLabel} - ${tenant.name}`,
          html,
        })

        sent++
      } catch (err) {
        failed++
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`${tenant.name}: ${msg}`)
        console.error(`Monthly report failed for tenant ${tenant.id}:`, msg)
      }
    }

    return NextResponse.json({
      success: true,
      period: periodLabel,
      sent,
      failed,
      errors: errors.slice(0, 10),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/cron/monthly-reports:', msg)
    return NextResponse.json(
      { error: 'Internal server error', details: msg },
      { status: 500 }
    )
  }
}

function countWorkingDays(year: number, month: number): number {
  let count = 0
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

interface ReportData {
  tenantName: string
  period: string
  revenue: number
  laborCost: number
  materialCost: number
  totalCost: number
  margin: number
  marginPercent: number
  totalHours: number
  employeeCount: number
  utilization: number
}

function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(amount)
}

function buildReportEmail(data: ReportData): string {
  const marginColor = data.marginPercent >= 20 ? '#22c55e' : data.marginPercent >= 10 ? '#eab308' : '#ef4444'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="background: #0a0a0a; color: #ffffff; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
    <h1 style="margin: 0 0 4px 0; font-size: 20px;">Manadsrapport ${data.period}</h1>
    <p style="margin: 0; color: #a0a0a0; font-size: 14px;">${data.tenantName}</p>
  </div>

  <h2 style="font-size: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">Lonsamhet</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr><td style="padding: 8px 0; color: #666;">Intakter</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatSEK(data.revenue)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Arbetskostnad</td><td style="padding: 8px 0; text-align: right;">${formatSEK(data.laborCost)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Materialkostnad</td><td style="padding: 8px 0; text-align: right;">${formatSEK(data.materialCost)}</td></tr>
    <tr style="border-top: 2px solid #e5e5e5;"><td style="padding: 8px 0; font-weight: 600;">Total kostnad</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatSEK(data.totalCost)}</td></tr>
    <tr><td style="padding: 8px 0; font-weight: 600;">Marginal</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${marginColor};">${formatSEK(data.margin)} (${data.marginPercent}%)</td></tr>
  </table>

  <h2 style="font-size: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">Resursutnyttjande</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr><td style="padding: 8px 0; color: #666;">Totala timmar</td><td style="padding: 8px 0; text-align: right;">${Math.round(data.totalHours)}h</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Aktiva anstallda</td><td style="padding: 8px 0; text-align: right;">${data.employeeCount}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Belaggningsgrad</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.utilization}%</td></tr>
  </table>

  <p style="font-size: 12px; color: #a0a0a0; margin-top: 32px;">
    Denna rapport genererades automatiskt av Frost Solutions.
  </p>
</body>
</html>`
}
