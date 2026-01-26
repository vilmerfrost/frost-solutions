import { NextResponse } from 'next/server'

/**
 * GET /api/cron/payroll-reminders
 * Cron endpoint för payroll reminders (placeholder)
 * Körs varje måndag kl 08:00
 */
export async function GET(request: Request) {
  // 🚨 SÄKERHETSKONTROLL: Verifiera cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // TODO: Implementera logik för att påminna om lönehantering
  // - Hitta orapporterade timmar för föregående vecka
  // - Skicka påminnelser till managers/admins
  // - Logga aktivitet

  console.log('Payroll reminders cron job executed (placeholder)')

  return NextResponse.json({ 
    success: true, 
    message: 'Payroll reminders not implemented yet.' 
  })
}
