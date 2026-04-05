import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'

const timesheetEntrySchema = z.object({
  project_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().min(0.25).max(24),
  description: z.string().max(1000).optional(),
})

const timesheetUploadSchema = z.object({
  entries: z.array(timesheetEntrySchema).min(1).max(100),
})

/**
 * POST /api/portal/subcontractor/timesheets
 * Subcontractor uploads timesheet data.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    if (auth.user.portalUserType !== 'subcontractor') {
      return apiError('This endpoint is only available for subcontractor portal users', 403)
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const parsed = timesheetUploadSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    // Verify subcontractor
    const { data: subcontractor } = await auth.admin
      .from('subcontractors')
      .select('id, company_name')
      .eq('tenant_id', auth.user.tenantId)
      .eq('id', auth.user.clientId)
      .single()

    if (!subcontractor) {
      return apiError('Subcontractor profile not found', 404)
    }

    // Verify all projects are assigned to this subcontractor
    const projectIds = [...new Set(parsed.data.entries.map((e) => e.project_id))]
    const { data: assignments } = await auth.admin
      .from('subcontractor_assignments')
      .select('project_id')
      .eq('subcontractor_id', subcontractor.id)
      .eq('tenant_id', auth.user.tenantId)
      .in('project_id', projectIds)

    const assignedProjectIds = new Set((assignments ?? []).map((a) => a.project_id))
    const unassigned = projectIds.filter((pid) => !assignedProjectIds.has(pid))
    if (unassigned.length > 0) {
      return apiError('Not assigned to one or more projects', 403, {
        unassigned_project_ids: unassigned,
      })
    }

    // Insert timesheet entries as time_entries with subcontractor metadata
    const records = parsed.data.entries.map((entry) => ({
      tenant_id: auth.user.tenantId,
      project_id: entry.project_id,
      date: entry.date,
      hours: entry.hours,
      description: entry.description ?? null,
      employee_id: null, // Subcontractor, not an employee
      hourly_rate: 0, // Rate handled via supplier invoices
      metadata: {
        source: 'subcontractor_portal',
        subcontractor_id: subcontractor.id,
        subcontractor_name: subcontractor.company_name,
        portal_user_id: auth.user.id,
      },
    }))

    const { data: inserted, error: insertErr } = await auth.admin
      .from('time_entries')
      .insert(records)
      .select('id, project_id, date, hours')

    if (insertErr) {
      return apiError('Failed to save timesheet entries', 500)
    }

    return apiSuccess({
      message: 'Timesheet uploaded successfully',
      entries_created: (inserted ?? []).length,
      entries: inserted ?? [],
    }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * GET /api/portal/subcontractor/timesheets
 * List subcontractor's submitted timesheet entries.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    if (auth.user.portalUserType !== 'subcontractor') {
      return apiError('This endpoint is only available for subcontractor portal users', 403)
    }

    const { searchParams } = req.nextUrl
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let query = auth.admin
      .from('time_entries')
      .select('id, project_id, date, hours, description, metadata')
      .eq('tenant_id', auth.user.tenantId)
      .contains('metadata', { subcontractor_id: auth.user.clientId })
      .order('date', { ascending: false })

    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)

    const { data, error } = await query.limit(500)

    if (error) {
      return apiError('Failed to fetch timesheets', 500)
    }

    return apiSuccess(data ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}
