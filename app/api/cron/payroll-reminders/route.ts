import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * GET /api/cron/payroll-reminders
 * Cron endpoint for payroll reminders
 * Runs every Monday at 08:00
 *
 * Reminds tenant owners about pending payroll periods that need processing.
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Check for email provider
  if (!process.env.RESEND_API_KEY) {
    console.warn('[payroll-reminders] RESEND_API_KEY not configured, skipping email send')
    return NextResponse.json({
      success: true,
      message: 'No email provider configured (RESEND_API_KEY missing), skipping',
      sent: 0,
    })
  }

  // Lazy import to avoid errors when RESEND_API_KEY is missing
  const { getResend, fromAddress } = await import('@/utils/supabase/resend')

  try {
    const admin = createAdminClient()
    const resend = getResend()
    const from = fromAddress()

    // Find payroll periods that are still in draft/pending status
    const { data: pendingPeriods, error } = await admin
      .from('payroll_periods')
      .select('id, period_start, period_end, status, tenant_id')
      .in('status', ['draft', 'pending'])

    if (error) {
      console.error('[payroll-reminders] Failed to fetch payroll periods:', error)
      return NextResponse.json({ error: 'Failed to fetch payroll periods' }, { status: 500 })
    }

    if (!pendingPeriods || pendingPeriods.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending payroll periods', sent: 0 })
    }

    // Group by tenant
    const byTenant = new Map<string, typeof pendingPeriods>()
    for (const period of pendingPeriods) {
      const list = byTenant.get(period.tenant_id) ?? []
      list.push(period)
      byTenant.set(period.tenant_id, list)
    }

    let sent = 0
    let failed = 0

    for (const [tenantId, periods] of byTenant) {
      try {
        const { data: tenant } = await admin
          .from('tenants')
          .select('name, owner_email')
          .eq('id', tenantId)
          .single()

        if (!tenant?.owner_email) continue

        const periodRows = periods
          .map((p) => {
            const statusLabel = p.status === 'draft' ? 'Utkast' : 'Vantar'
            return `<tr>
              <td style="padding:6px 12px;border-bottom:1px solid #eee;">${p.period_start} - ${p.period_end}</td>
              <td style="padding:6px 12px;border-bottom:1px solid #eee;">${statusLabel}</td>
            </tr>`
          })
          .join('\n')

        const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;">
  <h2 style="margin:0 0 16px;">Lonekorspasminnelse</h2>
  <p>Hej! Det finns ${periods.length} loneperiod(er) som behover hanteras:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px 12px;text-align:left;">Period</th>
        <th style="padding:8px 12px;text-align:left;">Status</th>
      </tr>
    </thead>
    <tbody>${periodRows}</tbody>
  </table>
  <p>Logga in i Frost Solutions for att granska och godkanna lonekorsningar.</p>
  <p style="font-size:12px;color:#a0a0a0;margin-top:32px;">Automatiskt meddelande fran Frost Solutions.</p>
</body></html>`

        await resend.emails.send({
          from,
          to: tenant.owner_email,
          subject: `${periods.length} loneperiod(er) vantar - ${tenant.name}`,
          html,
        })

        sent++
      } catch (err) {
        failed++
        console.error(`[payroll-reminders] Failed for tenant ${tenantId}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      pending_count: pendingPeriods.length,
      tenants_notified: sent,
      tenants_failed: failed,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[payroll-reminders] Error:', msg)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}
