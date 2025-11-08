import { getResend, fromAddress } from '@/utils/supabase/resend'
import { createAdminClient } from '@/utils/supabase/admin'

export interface SendQuoteEmailOptions {
  tenantId: string
  quoteId: string
  to: string
  subject?: string
  pdfBuffer?: Buffer
  trackingUrl?: string
}

export async function sendQuoteEmail(opts: SendQuoteEmailOptions) {
  const resend = getResend()

  // Simple HTML email template
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Offert från Frost</h1>
          </div>
          <div class="content">
            <p>Hej,</p>
            <p>Vi är glada att presentera er offert. Offerten är bifogad som PDF.</p>
            ${opts.trackingUrl ? `<img src="${opts.trackingUrl}" width="1" height="1" alt="" style="display:none;" />` : ''}
            <p>Med vänliga hälsningar,<br>Frost Data AB</p>
          </div>
          <div class="footer">
            <p>Detta är ett automatiskt meddelande. Svara inte på detta email.</p>
          </div>
        </div>
      </body>
    </html>
  `

  const attachments = opts.pdfBuffer ? [{
    filename: `offert-${opts.quoteId}.pdf`,
    content: opts.pdfBuffer
  }] : undefined

  const result = await resend.emails.send({
    from: fromAddress(),
    to: [opts.to],
    subject: opts.subject ?? 'Er offert från Frost',
    html,
    attachments
  })

  // Update email count (fallback: manual increment)
  try {
    const admin = createAdminClient()
    const { data: currentQuote } = await admin
      .from('quotes')
      .select('email_sent_count')
      .eq('id', opts.quoteId)
      .single()
    
    if (currentQuote) {
      await admin
        .from('quotes')
        .update({ email_sent_count: (currentQuote.email_sent_count || 0) + 1 })
        .eq('id', opts.quoteId)
    }
  } catch {
    // Silent fail for email count update
  }

  return result
}

