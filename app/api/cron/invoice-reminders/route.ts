import { NextResponse } from 'next/server'

/**
 * GET /api/cron/invoice-reminders
 * Cron endpoint för invoice reminders (placeholder)
 * Körs dagligen kl 09:00
 */
export async function GET(request: Request) {
  // 🚨 SÄKERHETSKONTROLL: Verifiera cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // TODO: Implementera logik för att påminna om fakturor
  // - Hitta förfallna/snart förfallna fakturor
  // - Skicka påminnelser till kunder
  // - Logga skickade påminnelser

  console.log('Invoice reminders cron job executed (placeholder)')

  return NextResponse.json({ 
    success: true, 
    message: 'Invoice reminders not implemented yet.' 
  })
}
