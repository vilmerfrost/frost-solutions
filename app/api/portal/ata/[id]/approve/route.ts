import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'
import { validateTransition } from '@/lib/ata/workflow'
import { logAtaEvent } from '@/lib/ata/audit'

const PortalApproveSchema = z.object({
  approved: z.boolean(),
  rejected_reason: z.string().optional(),
  bankid_reference: z.string().optional(),
})

/**
 * POST /api/portal/ata/[id]/approve
 * Customer portal user approves/rejects an ÄTA.
 * Requires portal auth + ÄTA must belong to a project of their client.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    const { id: ataId } = await params
    const parsed = await parseBody(req, PortalApproveSchema)
    if (parsed.error) return parsed.error

    const { approved, rejected_reason, bankid_reference } = parsed.data

    // Fetch ÄTA and verify it belongs to one of the customer's projects
    const { data: ata } = await auth.admin
      .from('rot_applications')
      .select('*, projects!inner(client_id)')
      .eq('id', ataId)
      .eq('tenant_id', auth.user.tenantId)
      .single()

    if (!ata) return apiError('ÄTA not found', 404)

    // Verify the project belongs to the customer's client
    const projectClientId = (ata as Record<string, unknown>).projects
      ? ((ata as Record<string, unknown>).projects as { client_id: string }).client_id
      : null

    if (projectClientId !== auth.user.clientId) {
      return apiError('ÄTA not found', 404)
    }

    const currentStatus = ata.status_timeline?.[ata.status_timeline.length - 1]?.status ?? 'created'
    const targetStatus = approved ? 'customer_approved' : 'customer_rejected'

    const validation = validateTransition(currentStatus, targetStatus)
    if (!validation.valid) return apiError(validation.error!, 400)

    const timeline = [
      ...(ata.status_timeline ?? []),
      { status: targetStatus, timestamp: new Date().toISOString(), user_id: auth.user.id },
    ]

    await auth.admin
      .from('rot_applications')
      .update({
        customer_approval_status: approved ? 'approved' : 'rejected',
        customer_approved_at: approved ? new Date().toISOString() : null,
        customer_rejected_reason: rejected_reason ?? null,
        status_timeline: timeline,
      })
      .eq('id', ataId)

    await logAtaEvent({
      tenantId: auth.user.tenantId,
      ataId,
      eventType: approved ? 'customer_approved' : 'customer_rejected',
      actorId: auth.user.id,
      actorType: 'customer',
      data: {
        approved,
        rejected_reason: rejected_reason ?? null,
        portal_user: auth.user.email,
        bankid_reference: bankid_reference ?? null,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    if (bankid_reference) {
      await logAtaEvent({
        tenantId: auth.user.tenantId,
        ataId,
        eventType: 'signed_bankid',
        actorId: auth.user.id,
        actorType: 'customer',
        data: { bankid_reference },
      })
    }

    return apiSuccess({ status: targetStatus })
  } catch (error) {
    return handleRouteError(error)
  }
}
