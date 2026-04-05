import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const updateLogSchema = z.object({
  summary: z.string().min(1).max(2000).optional(),
  weather: z.string().max(100).optional(),
  temperature_c: z.number().int().min(-50).max(60).optional(),
  workers_on_site: z.number().int().min(0).optional(),
  work_performed: z.string().max(5000).optional(),
  materials_used: z.string().max(5000).optional(),
  issues: z.string().max(5000).optional(),
  photos: z.array(z.string()).optional(),
  visible_to_customer: z.boolean().optional(),
})

/**
 * GET /api/projects/[id]/daily-log/[logId]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId, logId } = await params

    const { data, error } = await auth.admin
      .from('daily_logs')
      .select('*')
      .eq('id', logId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error || !data) {
      return apiError('Daily log not found', 404)
    }

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * PUT /api/projects/[id]/daily-log/[logId]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId, logId } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = updateLogSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { data, error } = await auth.admin
      .from('daily_logs')
      .update(parsed.data)
      .eq('id', logId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error || !data) {
      return apiError('Daily log not found or update failed', 404)
    }

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * DELETE /api/projects/[id]/daily-log/[logId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId, logId } = await params

    const { error } = await auth.admin
      .from('daily_logs')
      .delete()
      .eq('id', logId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)

    if (error) {
      return apiError('Failed to delete daily log', 500)
    }

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
