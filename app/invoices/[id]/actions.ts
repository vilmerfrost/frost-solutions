'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getResend, fromAddress } from '@/utils/supabase/resend'
import { redirect } from 'next/navigation'
import { getBaseUrlFromHeaders } from '@/utils/url'

function sek(n: number) {
 try { return Number(n ?? 0).toLocaleString('sv-SE',{style:'currency',currency:'SEK'}) } catch { return `${Math.round(Number(n??0))} kr` }
}

export async function sendInvoiceEmail(invoiceId: string) {
 const supabase = createClient()

 // Hämta faktura + rader
 const { data: invoice, error: invErr } = await supabase
  .from('invoices')
  .select('*')
  .eq('id', invoiceId)
  .single()

 if (invErr || !invoice) throw new Error(invErr?.message || 'Invoice not found')

 const { data: lines, error: lineErr } = await supabase
  .from('invoice_lines')
  .select('description, quantity, unit, rate_sek, amount_sek')
  .eq('invoice_id', invoiceId)
  .order('sort_order', { ascending: true })

 if (lineErr) throw new Error(lineErr.message)

 const rows = lines ?? []
 const subtotal = Number(invoice.subtotal_sek ?? 0)
 const rot = Number(invoice.rot_amount_sek ?? 0)
 const total = Number(invoice.total_due_sek ?? 0)

 // Mottagare - hämta från client-record om client_id finns
 let to = invoice.customer_email || ''
 
 // Om ingen email i faktura, försök hämta från client-record
 if (!to && invoice.client_id) {
  const { data: clientData } = await supabase
   .from('clients')
   .select('email')
   .eq('id', invoice.client_id)
   .maybeSingle()
  
  if (clientData?.email) {
   to = clientData.email
  }
 }
 
 // Om fortfarande ingen email, försök från customer_id
 if (!to && invoice.customer_id) {
  const { data: clientData2 } = await supabase
   .from('clients')
   .select('email')
   .eq('id', invoice.customer_id)
   .maybeSingle()
  
  if (clientData2?.email) {
   to = clientData2.email
  }
 }
 
 if (!to) throw new Error('Fakturan saknar kundens e-post. Kontrollera att kunden har en e-postadress.')

 // Länk till vy (kunden kan klicka)
 // Use getBaseUrlFromHeaders to get current origin (works with ngrok, localhost, production)
 const h = await headers()
 const origin = getBaseUrlFromHeaders(h)
 const viewUrl = `${origin}/invoices/${invoice.id}`

 // Mail HTML (enkel men tydlig)
 const html = `
  <div style="font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width:640px; margin:0 auto; color:#111">
   <h1 style="margin:0 0 16px; color:#1f3a8a;">Frost Solutions – Faktura ${invoice.number}</h1>
   <p>Hej ${invoice.customer_name || ''},</p>
   <p>Här kommer er faktura för utfört arbete.</p>

   <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse:collapse; border:1px solid #e5e7eb; margin:16px 0;">
    <thead>
     <tr style="background:#f9fafb;">
      <th align="left">Beskrivning</th>
      <th align="right">Antal</th>
      <th align="right">Enhet</th>
      <th align="right">Á-pris</th>
      <th align="right">Summa</th>
     </tr>
    </thead>
    <tbody>
     ${rows.length === 0 ? `<tr><td colspan="5" align="center" style="color:#6b7280">Inga rader</td></tr>` :
      rows.map(r => `
       <tr style="border-top:1px solid #e5e7eb">
        <td>${r.description}</td>
        <td align="right">${Number(r.quantity).toFixed(2)}</td>
        <td align="right">${r.unit}</td>
        <td align="right">${sek(r.rate_sek)}</td>
        <td align="right"><strong>${sek(r.amount_sek)}</strong></td>
       </tr>
      `).join('')}
    </tbody>
   </table>

   <div style="text-align:right; margin:16px 0;">
    <div>Summa: <strong>${sek(subtotal)}</strong></div>
    <div>Preliminärt ROT (30%): <strong style="color:#065f46">−${sek(rot)}</strong></div>
    <div style="border-top:1px solid #111; padding-top:8px; font-size:18px;">
     ATT BETALA: <strong>${sek(total)}</strong>
    </div>
   </div>

   <p>Betalningsvillkor: 30 dagar netto. Förfallodatum: ${new Date(invoice.due_date).toLocaleDateString('sv-SE')}</p>

   <p><a href="${viewUrl}" style="color:#1d4ed8; text-decoration:underline;">Visa fakturan på webben</a></p>

   <p>Med vänlig hälsning,<br/>Frost Solutions</p>
  </div>
 `

 // Skicka med Resend
 const resend = getResend()
 const from = fromAddress()

 const { error: emailErr } = await resend.emails.send({
  from,
  to,
  subject: `Faktura ${invoice.number} – Frost Solutions`,
  html,
 })
 if (emailErr) throw new Error(emailErr.message)

 // Sätt status=sent
 const { error: stErr } = await supabase.rpc('set_invoice_status', {
  p_invoice_id: invoiceId,
  p_status: 'sent',
 })
 if (stErr) throw new Error(stErr.message)

 // Tillbaka till fakturan (med notis via query)
 redirect(`/invoices/${invoiceId}?sent=1`)
}

export async function markInvoicePaid(invoiceId: string) {
 const supabase = createClient()

 const { error } = await supabase.rpc('set_invoice_status', {
  p_invoice_id: invoiceId,
  p_status: 'paid',
 })

 if (error) throw new Error(error.message)
 redirect(`/invoices/${invoiceId}?paid=1`)
}
