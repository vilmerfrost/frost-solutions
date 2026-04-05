import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'

/**
 * GET /api/portal/subcontractor/dashboard
 * Returns assigned projects for the subcontractor (limited scope, no financial data).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    if (auth.user.portalUserType !== 'subcontractor') {
      return apiError('This endpoint is only available for subcontractor portal users', 403)
    }

    // Find subcontractor record linked to this portal user's clientId
    // clientId doubles as the subcontractor link for subcontractor portal users
    const { data: subcontractor } = await auth.admin
      .from('subcontractors')
      .select('id, company_name, contact_name, specialty')
      .eq('tenant_id', auth.user.tenantId)
      .eq('id', auth.user.clientId)
      .single()

    if (!subcontractor) {
      return apiError('Subcontractor profile not found', 404)
    }

    // Fetch assigned projects (via subcontractor_assignments)
    const { data: assignments } = await auth.admin
      .from('subcontractor_assignments')
      .select('id, project_id, role, start_date, end_date, status')
      .eq('subcontractor_id', subcontractor.id)
      .eq('tenant_id', auth.user.tenantId)

    // Fetch project details (name, status only — no financial info)
    const projectIds = (assignments ?? []).map((a) => a.project_id).filter(Boolean)
    let projects: Array<Record<string, unknown>> = []

    if (projectIds.length > 0) {
      const { data: projData } = await auth.admin
        .from('projects')
        .select('id, name, status, start_date, end_date, address')
        .eq('tenant_id', auth.user.tenantId)
        .in('id', projectIds)

      projects = projData ?? []
    }

    // Merge project info into assignments
    const projectMap = new Map(projects.map((p) => [p.id, p]))
    const enrichedAssignments = (assignments ?? []).map((a) => ({
      ...a,
      project: projectMap.get(a.project_id) ?? null,
    }))

    return apiSuccess({
      subcontractor: {
        id: subcontractor.id,
        company_name: subcontractor.company_name,
        contact_name: subcontractor.contact_name,
        specialty: subcontractor.specialty,
      },
      assignments: enrichedAssignments,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
