import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateAssignmentSchema = z.object({
  project_id: z.string().uuid(),
  scope: z.string().optional(),
  budget_sek: z.number().positive().optional(),
  status: z.enum(['active', 'completed', 'terminated']).default('active'),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: subcontractorId } = await params

    const { data, error } = await auth.admin
      .from('subcontractor_assignments')
      .select('*')
      .eq('subcontractor_id', subcontractorId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (error) return apiError(error.message || 'Failed to fetch assignments', 500)

    return apiSuccess(data ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
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

    let parsed: z.infer<typeof CreateAssignmentSchema>
    try {
      parsed = CreateAssignmentSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: subcontractorId } = await params

    const { data, error } = await auth.admin
      .from('subcontractor_assignments')
      .insert({
        tenant_id: auth.tenantId,
        subcontractor_id: subcontractorId,
        project_id: parsed.project_id,
        scope: parsed.scope ?? null,
        budget_sek: parsed.budget_sek ?? null,
        status: parsed.status,
      })
      .select()
      .single()

    if (error) {
      if (error.message?.includes('unique') || error.code === '23505') {
        return apiError('Subcontractor already assigned to this project', 409)
      }
      return apiError(error.message || 'Failed to create assignment', 500)
    }

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
