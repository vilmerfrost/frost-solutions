import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateIncidentSchema = z.object({
  project_id: z.string().uuid().optional(),
  reported_by: z.string().uuid(),
  incident_type: z.enum(['accident', 'near_miss', 'hazard', 'observation']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  description: z.string().min(1),
  location: z.string().optional(),
  photos: z.array(z.string()).optional(),
  corrective_actions: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const projectId = req.nextUrl.searchParams.get('project_id')
    const status = req.nextUrl.searchParams.get('status')

    let q = auth.admin
      .from('safety_incidents')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (projectId) q = q.eq('project_id', projectId)
    if (status) q = q.eq('status', status)

    const { data, error } = await q

    if (error) return apiError(error.message || 'Failed to fetch incidents', 500)

    return apiSuccess(data ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof CreateIncidentSchema>
    try {
      parsed = CreateIncidentSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('safety_incidents')
      .insert({
        tenant_id: auth.tenantId,
        project_id: parsed.project_id ?? null,
        reported_by: parsed.reported_by,
        incident_type: parsed.incident_type,
        severity: parsed.severity,
        description: parsed.description,
        location: parsed.location ?? null,
        photos: parsed.photos ?? [],
        corrective_actions: parsed.corrective_actions ?? null,
      })
      .select()
      .single()

    if (error) return apiError(error.message || 'Failed to create incident', 500)

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
