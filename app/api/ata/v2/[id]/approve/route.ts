import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { validateTransition } from '@/lib/ata/workflow'
import { logAtaEvent } from '@/lib/ata/audit'
import { createAdminClient } from '@/utils/supabase/admin'

const ApproveSchema = z.object({
  token: z.string().min(1),
  approved: z.boolean(),
  rejected_reason: z.string().optional(),
  bankid_reference: z.string().optional(),
})

/**
 * POST /api/ata/v2/[id]/approve
 * Public endpoint — customer approves or rejects an ÄTA via token
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsed = await parseBody(req, ApproveSchema)
    if (parsed.error) return parsed.error

    const { token, approved, rejected_reason, bankid_reference } = parsed.data

    const admin = createAdminClient()

    // Verify token matches
    const { data: ata } = await admin
      .from('rot_applications')
      .select('*')
      .eq('id', id)
      .eq('customer_approval_token', token)
      .single()

    if (!ata) return apiError('Invalid or expired approval token', 403)

    const currentStatus = ata.status_timeline?.[ata.status_timeline.length - 1]?.status ?? 'created'
    const targetStatus = approved ? 'customer_approved' : 'customer_rejected'

    const validation = validateTransition(currentStatus, targetStatus)
    if (!validation.valid) return apiError(validation.error!, 400)

    const timeline = [
      ...(ata.status_timeline ?? []),
      { status: targetStatus, timestamp: new Date().toISOString(), user_id: 'customer' },
    ]

    await admin
      .from('rot_applications')
      .update({
        customer_approval_status: approved ? 'approved' : 'rejected',
        customer_approved_at: approved ? new Date().toISOString() : null,
        customer_rejected_reason: rejected_reason ?? null,
        status_timeline: timeline,
      })
      .eq('id', id)

    await logAtaEvent({
      tenantId: ata.tenant_id,
      ataId: id,
      eventType: approved ? 'customer_approved' : 'customer_rejected',
      actorId: 'customer',
      actorType: 'customer',
      data: {
        approved,
        rejected_reason: rejected_reason ?? null,
        bankid_reference: bankid_reference ?? null,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    // If BankID was used, log signing event
    if (bankid_reference) {
      await logAtaEvent({
        tenantId: ata.tenant_id,
        ataId: id,
        eventType: 'signed_bankid',
        actorId: 'customer',
        actorType: 'customer',
        data: { bankid_reference },
      })
    }

    return apiSuccess({ status: targetStatus })
  } catch (error) {
    return handleRouteError(error)
  }
}
