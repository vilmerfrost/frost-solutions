import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError } from '@/lib/api'

export const runtime = 'nodejs'

const CreateSavedReportSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  report_type: z.enum(['profitability', 'utilization', 'cashflow', 'project_status', 'custom']),
  config: z.record(z.unknown()).default({}),
  schedule: z.string().optional(),
})

/**
 * GET /api/reports/saved
 * List saved report configurations for the tenant.
 */
export async function GET(_req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('saved_reports')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Saved reports list error:', error)
      return apiError('Failed to list saved reports', 500)
    }

    return apiSuccess(data ?? [])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in GET /api/reports/saved:', msg)
    return apiError('Internal server error', 500)
  }
}

/**
 * POST /api/reports/saved
 * Save a new report configuration.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, CreateSavedReportSchema)
    if (body.error) return body.error

    // Resolve employee id for created_by
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .eq('auth_user_id', auth.user.id)
      .limit(1)
      .single()

    const { data, error } = await auth.admin
      .from('saved_reports')
      .insert({
        tenant_id: auth.tenantId,
        name: body.data.name,
        report_type: body.data.report_type,
        config: body.data.config,
        created_by: employee?.id ?? null,
        schedule: body.data.schedule ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Saved report create error:', error)
      return apiError('Failed to save report', 500)
    }

    return apiSuccess(data, 201)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in POST /api/reports/saved:', msg)
    return apiError('Internal server error', 500)
  }
}
