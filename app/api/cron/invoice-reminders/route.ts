import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * GET /api/cron/invoice-reminders
 * Cron endpoint for invoice reminders
 * Runs daily at 09:00
 *
 * Sends email reminders for overdue invoices to the tenant owner.
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
    console.warn('[invoice-reminders] RESEND_API_KEY not configured, skipping email send')
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

    const today = new Date().toISOString().split('T')[0]

    // Find overdue unpaid invoices grouped by tenant
    const { data: overdueInvoices, error } = await admin
      .from('invoices')
      .select('id, invoice_number, client_name, total_amount, due_date, tenant_id')
      .eq('status', 'sent')
      .lt('due_date', today)

    if (error) {
      console.error('[invoice-reminders] Failed to fetch overdue invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return NextResponse.json({ success: true, message: 'No overdue invoices', sent: 0 })
    }

    // Group by tenant
    const byTenant = new Map<string, typeof overdueInvoices>()
    for (const inv of overdueInvoices) {
      const list = byTenant.get(inv.tenant_id) ?? []
      list.push(inv)
      byTenant.set(inv.tenant_id, list)
    }

    let sent = 0
    let failed = 0

    for (const [tenantId, invoices] of byTenant) {
      try {
        // Get tenant owner email
        const { data: tenant } = await admin
          .from('tenants')
          .select('name, owner_email')
          .eq('id', tenantId)
          .single()

        if (!tenant?.owner_email) continue

        const invoiceRows = invoices
          .map((inv) => {
            const amount = new Intl.NumberFormat('sv-SE', {
              style: 'currency',
              currency: 'SEK',
              maximumFractionDigits: 0,
            }).format(Number(inv.total_amount ?? 0))
            return `<tr>
              <td style="padding:6px 12px;border-bottom:1px solid #eee;">${inv.invoice_number ?? inv.id}</td>
              <td style="padding:6px 12px;border-bottom:1px solid #eee;">${inv.client_name ?? '-'}</td>
              <td style="padding:6px 12px;border-bottom:1px solid #eee;">${inv.due_date}</td>
              <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;">${amount}</td>
            </tr>`
          })
          .join('\n')

        const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;">
  <h2 style="margin:0 0 16px;">Forfallna fakturor</h2>
  <p>Hej! Foljande ${invoices.length} faktura(or) har passerat forfallodag:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px 12px;text-align:left;">Fakturanr</th>
        <th style="padding:8px 12px;text-align:left;">Kund</th>
        <th style="padding:8px 12px;text-align:left;">Forfallodatum</th>
        <th style="padding:8px 12px;text-align:right;">Belopp</th>
      </tr>
    </thead>
    <tbody>${invoiceRows}</tbody>
  </table>
  <p style="font-size:12px;color:#a0a0a0;margin-top:32px;">Automatiskt meddelande fran Frost Solutions.</p>
</body></html>`

        await resend.emails.send({
          from,
          to: tenant.owner_email,
          subject: `${invoices.length} forfallna fakturor - ${tenant.name}`,
          html,
        })

        sent++
      } catch (err) {
        failed++
        console.error(`[invoice-reminders] Failed for tenant ${tenantId}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      overdue_count: overdueInvoices.length,
      tenants_notified: sent,
      tenants_failed: failed,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[invoice-reminders] Error:', msg)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}
