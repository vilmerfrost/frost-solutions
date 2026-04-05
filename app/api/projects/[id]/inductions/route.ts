import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateInductionSchema = z.object({
  employee_id: z.string().uuid(),
  inducted_by: z.string().uuid().optional(),
  signed_at: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params

    const { data, error } = await auth.admin
      .from('site_inductions')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (error) return apiError(error.message || 'Failed to fetch inductions', 500)

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

    let parsed: z.infer<typeof CreateInductionSchema>
    try {
      parsed = CreateInductionSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params

    // If inducted_by not provided, use current user's employee record
    let inductedBy = parsed.inducted_by
    if (!inductedBy) {
      const { data: employee } = await auth.admin
        .from('employees')
        .select('id')
        .eq('auth_user_id', auth.user.id)
        .eq('tenant_id', auth.tenantId)
        .maybeSingle()
      inductedBy = employee?.id ?? undefined
    }

    const { data, error } = await auth.admin
      .from('site_inductions')
      .insert({
        tenant_id: auth.tenantId,
        project_id: projectId,
        employee_id: parsed.employee_id,
        inducted_by: inductedBy ?? null,
        signed_at: parsed.signed_at ?? new Date().toISOString(),
        notes: parsed.notes ?? null,
      })
      .select()
      .single()

    if (error) {
      if (error.message?.includes('unique') || error.code === '23505') {
        return apiError('Employee already inducted for this project', 409)
      }
      return apiError(error.message || 'Failed to create induction', 500)
    }

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
