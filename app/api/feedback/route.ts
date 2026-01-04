import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/lib/security'

/**
 * API route för att skicka feedback via email
 * Skickar email till vilmer.frost@gmail.com
 */
export async function POST(req: Request) {
 try {
  // Rate limiting - max 5 feedback per IP per 10 minutes
  const clientIP = getClientIP(req)
  const rateLimit = checkRateLimit(`feedback:${clientIP}`, 5, 10 * 60 * 1000)
  
  if (!rateLimit.allowed) {
   return NextResponse.json(
    { 
     error: 'För många förfrågningar. Försök igen om ' + rateLimit.retryAfter + ' sekunder.',
     retryAfter: rateLimit.retryAfter
    },
    { status: 429 }
   )
  }

  const { type, subject, message, email, userName, userAgent, url } = await req.json()

  // Input validation
  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
   return NextResponse.json(
    { error: 'Subject krävs och måste vara en sträng' },
    { status: 400 }
   )
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
   return NextResponse.json(
    { error: 'Meddelande krävs och måste vara en sträng' },
    { status: 400 }
   )
  }

  // Sanitize inputs
  const sanitizedSubject = subject.trim().slice(0, 200)
  const sanitizedMessage = message.trim().slice(0, 5000)

  // Format email body
  const typeLabels: Record<string, string> = {
   bug: '🐛 Buggrapport',
   feature: '💡 Funktionförslag',
   other: '📝 Övrig feedback',
  }

  const emailBody = `
Feedback från Frost Solutions App

Typ: ${typeLabels[type] || 'Övrigt'}
Från: ${userName || 'Okänd'} (${email || 'Ingen email'})
URL: ${url || 'Okänt'}
User Agent: ${userAgent || 'Okänt'}
IP: ${clientIP}

---
Ämne: ${sanitizedSubject}

---
Meddelande:

${sanitizedMessage}

---
Detta meddelande skickades automatiskt från feedback-formuläret.
`

  // Send email using Resend API or similar
  // For now, we'll use a simple fetch to a email service
  // You can integrate with Resend, SendGrid, etc.

  // Option 1: Use Resend (recommended)
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (RESEND_API_KEY) {
   const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
     'Authorization': `Bearer ${RESEND_API_KEY}`,
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     from: 'Frost Solutions <feedback@frost-solutions.se>', // Update with your verified domain
     to: ['vilmer.frost@gmail.com'],
     subject: `${typeLabels[type] || 'Feedback'}: ${sanitizedSubject}`,
     text: emailBody,
     reply_to: email || undefined,
    }),
   })

   if (!resendRes.ok) {
    const errorData = await resendRes.json().catch(() => ({}))
    console.error('Resend API error:', errorData)
    throw new Error('Failed to send email via Resend')
   }

   return NextResponse.json({ success: true })
  }

  // Option 2: Use SendGrid
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  if (SENDGRID_API_KEY) {
   const sendgridRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
     'Authorization': `Bearer ${SENDGRID_API_KEY}`,
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     personalizations: [{
      to: [{ email: 'vilmer.frost@gmail.com' }],
      subject: `${typeLabels[type] || 'Feedback'}: ${subject}`,
     }],
     from: { email: 'feedback@frost-solutions.se', name: 'Frost Solutions' },
     content: [{
      type: 'text/plain',
      value: emailBody,
     }],
     reply_to: { email: email },
    }),
   })

   if (!sendgridRes.ok) {
    const errorText = await sendgridRes.text()
    console.error('SendGrid API error:', errorText)
    throw new Error('Failed to send email via SendGrid')
   }

   return NextResponse.json({ success: true })
  }

  // Option 3: Fallback - log to console and return success (for development)
  console.log('=== FEEDBACK EMAIL (No email service configured) ===')
  console.log(`To: vilmer.frost@gmail.com`)
  console.log(`Subject: ${typeLabels[type] || 'Feedback'}: ${subject}`)
  console.log(emailBody)
  console.log('==================================================')

  // For development: You can also save to database or file
  return NextResponse.json({ 
   success: true,
   message: 'Feedback logged (email service not configured - check console)'
  })
 } catch (err: any) {
  console.error('Error sending feedback email:', err)
  return NextResponse.json(
   { error: err.message || 'Failed to send feedback' },
   { status: 500 }
  )
 }
}

