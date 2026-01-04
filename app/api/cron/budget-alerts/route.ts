import { NextResponse } from 'next/server'
import { budgetAlertWorker } from '@/lib/workers/budgetAlertWorker'

/**
 * GET /api/cron/budget-alerts
 * Cron endpoint för budget alert worker
 * Anropas varje 15:e minut
 */
export async function GET(req: Request) {
 try {
  // Verifiera cron secret (för säkerhet)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await budgetAlertWorker()

  if (result.success) {
   return NextResponse.json({
    success: true,
    alertsCreated: result.alertsCreated || 0,
    errors: result.errors,
   })
  } else {
   return NextResponse.json(
    { success: false, error: result.error },
    { status: 500 }
   )
  }
 } catch (error: any) {
  console.error('Error in GET /api/cron/budget-alerts:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

