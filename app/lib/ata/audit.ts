import { createAdminClient } from '@/utils/supabase/admin'

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
  await admin.from('ata_audit_trail').insert({
    tenant_id: params.tenantId,
    ata_id: params.ataId,
    event_type: params.eventType,
    actor_id: params.actorId,
    actor_type: params.actorType,
    data: params.data ?? {},
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  })
}
