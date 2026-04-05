import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const createLogSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  summary: z.string().min(1).max(2000),
  author_id: z.string().uuid(),
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
 * GET /api/projects/[id]/daily-log
 * List daily logs for a project, optionally filtered by date range.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params
    const { searchParams } = req.nextUrl
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let query = auth.admin
      .from('daily_logs')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .eq('project_id', projectId)
      .order('log_date', { ascending: false })

    if (from) query = query.gte('log_date', from)
    if (to) query = query.lte('log_date', to)

    const { data, error } = await query

    if (error) {
      return apiError(error.message, 500)
    }

    return apiSuccess(data ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * POST /api/projects/[id]/daily-log
 * Create a daily log entry.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = createLogSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    // Verify project belongs to tenant
    const { data: project } = await auth.admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!project) {
      return apiError('Project not found', 404)
    }

    const { data, error } = await auth.admin
      .from('daily_logs')
      .insert({
        tenant_id: auth.tenantId,
        project_id: projectId,
        log_date: parsed.data.log_date ?? new Date().toISOString().slice(0, 10),
        author_id: parsed.data.author_id,
        summary: parsed.data.summary,
        weather: parsed.data.weather ?? null,
        temperature_c: parsed.data.temperature_c ?? null,
        workers_on_site: parsed.data.workers_on_site ?? null,
        work_performed: parsed.data.work_performed ?? null,
        materials_used: parsed.data.materials_used ?? null,
        issues: parsed.data.issues ?? null,
        photos: parsed.data.photos ?? [],
        visible_to_customer: parsed.data.visible_to_customer ?? true,
      })
      .select()
      .single()

    if (error) {
      const msg = error.message
      if (msg.includes('unique') || msg.includes('duplicate')) {
        return apiError('A daily log already exists for this date', 409)
      }
      return apiError(msg, 500)
    }

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
