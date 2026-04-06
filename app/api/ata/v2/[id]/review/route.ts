import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { validateTransition } from '@/lib/ata/workflow'
import { logAtaEvent } from '@/lib/ata/audit'

const ReviewSchema = z.object({
  labor_hours: z.number().min(0),
  labor_rate_sek: z.number().min(0),
  material_cost_sek: z.number().min(0),
  timeline_impact_days: z.number().int().min(0).default(0),
  admin_pricing_notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const parsed = await parseBody(req, ReviewSchema)
    if (parsed.error) return parsed.error

    // Fetch current ÄTA
    const { data: ata } = await auth.admin
      .from('rot_applications')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!ata) return apiError('ÄTA not found', 404)

    // Determine current status from timeline
    const currentStatus = ata.status_timeline?.[ata.status_timeline.length - 1]?.status ?? 'created'

    let photoCount = 1
    if (ata.ata_type === 'unforeseen') {
      const { data: photoEvents } = await auth.admin
        .from('ata_audit_trail')
        .select('data')
        .eq('ata_id', id)
        .eq('tenant_id', auth.tenantId)
        .eq('event_type', 'photos_added')

      photoCount = (photoEvents ?? []).reduce((total, event) => {
        const count = typeof event.data?.count === 'number' ? event.data.count : 0
        return total + count
      }, 0)
    }

    const validation = validateTransition(currentStatus, 'admin_reviewed', {
      ataType: ata.ata_type ?? 'foreseen',
      photoCount: ata.ata_type === 'unforeseen' ? photoCount : 1,
    })

    if (!validation.valid) return apiError(validation.error!, 400)

    const { labor_hours, labor_rate_sek, material_cost_sek, timeline_impact_days, admin_pricing_notes } = parsed.data
    const total_cost = labor_hours * labor_rate_sek + material_cost_sek

    // Update ÄTA
    const timeline = [
      ...(ata.status_timeline ?? []),
      { status: 'admin_reviewed', timestamp: new Date().toISOString(), user_id: auth.user.id },
    ]

    const { data: updated, error: updateError } = await auth.admin
      .from('rot_applications')
      .update({
        labor_hours,
        labor_rate_sek,
        cost_frame: total_cost,
        timeline_impact_days,
        admin_pricing_notes: admin_pricing_notes ?? null,
        status_timeline: timeline,
      })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (updateError) return apiError('Failed to update ÄTA', 500)

    // Find employee
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const actorId = employee?.id ?? auth.user.id

    await logAtaEvent({
      tenantId: auth.tenantId,
      ataId: id,
      eventType: 'admin_reviewed',
      actorId,
      actorType: 'employee',
      data: { labor_hours, labor_rate_sek, material_cost_sek, total_cost },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    await logAtaEvent({
      tenantId: auth.tenantId,
      ataId: id,
      eventType: 'pricing_set',
      actorId,
      actorType: 'employee',
      data: { labor_hours, labor_rate_sek, material_cost_sek, timeline_impact_days, total_cost },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
