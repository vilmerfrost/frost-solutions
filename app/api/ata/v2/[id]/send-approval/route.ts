import { NextRequest } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { validateTransition } from '@/lib/ata/workflow'
import { logAtaEvent } from '@/lib/ata/audit'

const SendApprovalSchema = z.object({
  use_bankid: z.boolean().default(false),
  customer_email: z.string().email().optional(),
  customer_name: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const parsed = await parseBody(req, SendApprovalSchema)
    if (parsed.error) return parsed.error

    const { use_bankid, customer_email, customer_name } = parsed.data

    // Fetch ÄTA
    const { data: ata } = await auth.admin
      .from('rot_applications')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!ata) return apiError('ÄTA not found', 404)

    const currentStatus = ata.status_timeline?.[ata.status_timeline.length - 1]?.status ?? 'created'
    const validation = validateTransition(currentStatus, 'approval_sent')
    if (!validation.valid) return apiError(validation.error!, 400)

    // Generate approval token
    const approvalToken = randomBytes(32).toString('hex')

    let signingOrderId: string | null = null

    // BankID signing requires PDF generation which is not yet implemented.
    if (use_bankid) {
      return apiError(
        'BankID-signering är inte tillgänglig ännu. Skicka godkännande utan BankID.',
        503
      )
    }

    // Update ÄTA
    const timeline = [
      ...(ata.status_timeline ?? []),
      { status: 'approval_sent', timestamp: new Date().toISOString(), user_id: auth.user.id },
    ]

    await auth.admin
      .from('rot_applications')
      .update({
        customer_approval_token: approvalToken,
        customer_approval_status: 'sent',
        signing_order_id: signingOrderId,
        status_timeline: timeline,
      })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    const { data: employee } = await auth.admin
      .from('employees')
      .select('id, name')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    await logAtaEvent({
      tenantId: auth.tenantId,
      ataId: id,
      eventType: 'approval_sent',
      actorId: employee?.id ?? auth.user.id,
      actorType: 'employee',
      data: {
        use_bankid,
        customer_email: customer_email ?? null,
        signing_order_id: signingOrderId,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    // Create a project message notifying the customer about the pending ÄTA approval
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/app'
    const portalApprovalUrl = `${appUrl}/portal/ata/${id}/approve`
    await auth.admin
      .from('project_messages')
      .insert({
        tenant_id: auth.tenantId,
        project_id: ata.project_id,
        sender_type: 'employee',
        sender_id: employee?.id ?? auth.user.id,
        sender_name: employee?.name ?? 'System',
        message: `En ÄTA-ändring behöver ditt godkännande: "${ata.description}". Totalt belopp: ${ata.cost_frame ?? 'TBD'} SEK. Godkänn här: ${portalApprovalUrl}`,
        attachments: [],
      })

    return apiSuccess({
      approval_token: approvalToken,
      approval_url: `${appUrl}/api/ata/v2/${id}/approve?token=${approvalToken}`,
      signing_order_id: signingOrderId,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
