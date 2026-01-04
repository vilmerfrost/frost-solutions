import { NextResponse } from 'next/server'
import { shareLinkCleanup } from '@/lib/workers/shareLinkCleanup'

/**
 * GET /api/cron/share-link-cleanup
 * Cron endpoint för share link cleanup worker
 * Anropas dagligen kl 02:00
 */
export async function GET(req: Request) {
 try {
  // Verifiera cron secret (för säkerhet)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await shareLinkCleanup()

  if (result.success) {
   return NextResponse.json({
    success: true,
    deactivated: result.deactivated || 0,
    cleaned_events: result.cleaned_events || 0,
    errors: result.errors,
   })
  } else {
   return NextResponse.json(
    { success: false, error: result.error },
    { status: 500 }
   )
  }
 } catch (error: any) {
  console.error('Error in GET /api/cron/share-link-cleanup:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

