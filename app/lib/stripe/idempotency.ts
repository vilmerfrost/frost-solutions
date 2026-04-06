import { createAdminClient } from '@/utils/supabase/admin'

export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('stripe_events')
    .select('status')
    .eq('stripe_event_id', stripeEventId)
    .maybeSingle()

  return data?.status === 'processed'
}

export async function markEventProcessed(stripeEventId: string, eventType: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('stripe_events').insert({ stripe_event_id: stripeEventId, event_type: eventType, status: 'processed' })
}

export async function markEventFailed(stripeEventId: string, eventType: string, errorMessage: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('stripe_events').upsert(
    { stripe_event_id: stripeEventId, event_type: eventType, status: 'failed', error_message: errorMessage },
    { onConflict: 'stripe_event_id' }
  )
}
