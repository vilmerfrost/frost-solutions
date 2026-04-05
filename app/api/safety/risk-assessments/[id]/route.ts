import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const RiskItemSchema = z.object({
  hazard: z.string().min(1),
  consequence: z.string().min(1),
  probability: z.enum(['low', 'medium', 'high']),
  severity: z.enum(['low', 'medium', 'high']),
  mitigation: z.string().min(1),
})

const UpdateSchema = z.object({
  title: z.string().optional(),
  risks: z.array(RiskItemSchema).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
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
      .from('risk_assessments')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error || !data) return apiError('Risk assessment not found', 404)

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

    let parsed: z.infer<typeof UpdateSchema>
    try {
      parsed = UpdateSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    const { data, error } = await auth.admin
      .from('risk_assessments')
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error || !data) return apiError('Risk assessment not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
