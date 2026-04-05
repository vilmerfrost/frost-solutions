import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const UpdateIncidentSchema = z.object({
  incident_type: z.enum(['accident', 'near_miss', 'hazard', 'observation']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().min(1).optional(),
  location: z.string().optional(),
  photos: z.array(z.string()).optional(),
  corrective_actions: z.string().optional(),
  status: z.enum(['reported', 'investigating', 'resolved', 'closed']).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    const { data, error } = await auth.admin
      .from('safety_incidents')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error || !data) return apiError('Incident not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof UpdateIncidentSchema>
    try {
      parsed = UpdateIncidentSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    const updateData: Record<string, unknown> = { ...parsed, updated_at: new Date().toISOString() }

    // Auto-set resolved_at and resolved_by when status changes to resolved
    if (parsed.status === 'resolved' || parsed.status === 'closed') {
      updateData.resolved_at = new Date().toISOString()

      const { data: employee } = await auth.admin
        .from('employees')
        .select('id')
        .eq('auth_user_id', auth.user.id)
        .eq('tenant_id', auth.tenantId)
        .maybeSingle()

      if (employee) {
        updateData.resolved_by = employee.id
      }
    }

    const { data, error } = await auth.admin
      .from('safety_incidents')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error || !data) return apiError('Incident not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
