import { NextRequest } from 'next/server'
import { apiSuccess, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    // Fetch all projects linked to this client
    const { data: projects } = await auth.admin
      .from('projects')
      .select('id, name, status, created_at, updated_at')
      .eq('client_id', auth.user.clientId)
      .eq('tenant_id', auth.user.tenantId)
      .order('updated_at', { ascending: false })

    // Fetch unread messages per project
    const projectList = await Promise.all(
      (projects ?? []).map(async (project) => {
        const { count } = await auth.admin
          .from('project_messages')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('tenant_id', auth.user.tenantId)
          .eq('sender_type', 'employee')
          .is('read_at', null)

        return {
          ...project,
          unread_messages: count ?? 0,
        }
      })
    )

    return apiSuccess({ projects: projectList })
  } catch (error) {
    return handleRouteError(error)
  }
}
