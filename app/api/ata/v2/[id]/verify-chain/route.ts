import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolveAuthAdmin } from '@/lib/api/auth'
import { computeEventHash } from '@/lib/ata/audit'

/**
 * GET /api/ata/v2/[id]/verify-chain
 * Verifies the hash chain for an ATA's audit trail is intact.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { admin, tenantId } = auth

    // Fetch all audit events in chronological order
    const { data: events, error } = await admin
      .from('ata_audit_trail')
      .select('id, event_type, actor_id, actor_type, data, ip_address, user_agent, created_at, event_hash, previous_hash, tenant_id, ata_id')
      .eq('ata_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (error) {
      return apiError('Failed to fetch audit events', 500)
    }

    if (!events || events.length === 0) {
      return apiError('No audit events found for this ATA', 404)
    }

    // Verify chain
    let previousHash: string | null = null

    for (const event of events) {
      // Skip events that predate the hash chain (no event_hash stored)
      if (!event.event_hash) {
        previousHash = null
        continue
      }

      // Verify previous_hash matches our expected chain
      if (event.previous_hash !== previousHash) {
        return apiSuccess({
          valid: false,
          brokenAt: event.id,
          events: events.length,
          message: `Chain broken at event ${event.id}: previous_hash mismatch`,
        })
      }

      // Recompute hash from event data
      const eventData: Record<string, unknown> = {
        tenant_id: event.tenant_id,
        ata_id: event.ata_id,
        event_type: event.event_type,
        actor_id: event.actor_id,
        actor_type: event.actor_type,
        data: event.data ?? {},
        ip_address: event.ip_address ?? null,
        user_agent: event.user_agent ?? null,
      }

      const recomputed = computeEventHash(previousHash, eventData, event.created_at)

      if (recomputed !== event.event_hash) {
        return apiSuccess({
          valid: false,
          brokenAt: event.id,
          events: events.length,
          message: `Chain broken at event ${event.id}: hash mismatch (data may have been tampered)`,
        })
      }

      previousHash = event.event_hash
    }

    return apiSuccess({
      valid: true,
      events: events.length,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
