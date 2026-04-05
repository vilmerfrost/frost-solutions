import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { logAtaEvent } from '@/lib/ata/audit'

const CreateAtaSchema = z.object({
  project_id: z.string().uuid(),
  description: z.string().min(1),
  ata_type: z.enum(['foreseen', 'unforeseen']),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal'),
  photos: z.array(z.string().url()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const parsed = await parseBody(req, CreateAtaSchema)
    if (parsed.error) return parsed.error
    const { project_id, description, ata_type, urgency, photos } = parsed.data

    // Unforeseen requires at least 1 photo
    if (ata_type === 'unforeseen' && (!photos || photos.length < 1)) {
      return apiError('Unforeseen ÄTA requires at least 1 photo', 400)
    }

    // Verify project belongs to tenant
    const { data: project } = await auth.admin
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!project) return apiError('Project not found', 404)

    // Find employee
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id, name')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    // Create rot_application with Legal Fortress fields
    const { data: ata, error: insertError } = await auth.admin
      .from('rot_applications')
      .insert({
        tenant_id: auth.tenantId,
        project_id,
        description,
        ata_type,
        urgency,
        customer_approval_status: 'pending',
        created_by_employee_id: employee?.id ?? null,
        status_timeline: [
          {
            status: 'created',
            timestamp: new Date().toISOString(),
            user_id: auth.user.id,
          },
        ],
      })
      .select()
      .single()

    if (insertError || !ata) {
      return apiError('Failed to create ÄTA', 500)
    }

    // Log audit event
    await logAtaEvent({
      tenantId: auth.tenantId,
      ataId: ata.id,
      eventType: 'created',
      actorId: employee?.id ?? auth.user.id,
      actorType: 'employee',
      data: { ata_type, urgency, photos: photos ?? [] },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    // If photos were provided, log that too
    if (photos && photos.length > 0) {
      await logAtaEvent({
        tenantId: auth.tenantId,
        ataId: ata.id,
        eventType: 'photos_added',
        actorId: employee?.id ?? auth.user.id,
        actorType: 'employee',
        data: { count: photos.length, urls: photos },
      })
    }

    return apiSuccess(ata, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
