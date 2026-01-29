import { NextResponse } from 'next/server'

/**
 * GET /api/cron/payroll-reminders
 * Cron endpoint för payroll reminders
 * Körs varje måndag kl 08:00
 * 
 * Status: Feature planned for future release
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Feature not yet implemented - returns success to avoid cron failures
  return NextResponse.json({ 
    success: true, 
    message: 'Payroll reminders feature coming soon',
    status: 'not_implemented'
  })
}
