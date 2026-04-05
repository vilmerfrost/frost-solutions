import { createAdminClient } from '@/utils/supabase/admin'
import { createHash } from 'crypto'

/**
 * Compute a SHA-256 hash for an audit event, chaining it to the previous event.
 */
export function computeEventHash(
  previousHash: string | null,
  eventData: Record<string, unknown>,
  timestamp: string
): string {
  const payload = (previousHash ?? '') + JSON.stringify(eventData) + timestamp
  return createHash('sha256').update(payload).digest('hex')
}

export async function logAtaEvent(params: {
  tenantId: string
  ataId: string
  eventType: string
  actorId: string
  actorType: 'employee' | 'customer' | 'system'
  data?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  const admin = createAdminClient()

  // Fetch the most recent event for this ata_id to get its hash
  const { data: lastEvent } = await admin
    .from('ata_audit_trail')
    .select('event_hash')
    .eq('ata_id', params.ataId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const previousHash: string | null = lastEvent?.event_hash ?? null
  const timestamp = new Date().toISOString()

  const eventData: Record<string, unknown> = {
    tenant_id: params.tenantId,
    ata_id: params.ataId,
    event_type: params.eventType,
    actor_id: params.actorId,
    actor_type: params.actorType,
    data: params.data ?? {},
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  }

  const eventHash = computeEventHash(previousHash, eventData, timestamp)

  await admin.from('ata_audit_trail').insert({
    tenant_id: params.tenantId,
    ata_id: params.ataId,
    event_type: params.eventType,
    actor_id: params.actorId,
    actor_type: params.actorType,
    data: params.data ?? {},
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    event_hash: eventHash,
    previous_hash: previousHash,
    created_at: timestamp,
  })
}
