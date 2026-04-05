import { NextRequest } from 'next/server'
import { apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { resolvePortalAuth } from '@/lib/portal/auth'
import { isRestrictedFolder } from '@/lib/documents/folders'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolvePortalAuth(req)
    if (auth.error) return auth.error

    const { id: projectId } = await params

    // Fetch project (must belong to customer's client)
    const { data: project } = await auth.admin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('client_id', auth.user.clientId)
      .eq('tenant_id', auth.user.tenantId)
      .single()

    if (!project) return apiError('Project not found', 404)

    // Fetch documents (non-restricted folders only)
    const { data: documents } = await auth.admin
      .from('project_documents')
      .select('id, folder, file_name, file_size, mime_type, version, created_at')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.user.tenantId)
      .order('created_at', { ascending: false })

    const visibleDocs = (documents ?? []).filter(d => !isRestrictedFolder(d.folder))

    // Fetch invoices
    const { data: invoices } = await auth.admin
      .from('invoices')
      .select('id, invoice_number, amount, status, due_date, created_at')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.user.tenantId)
      .order('created_at', { ascending: false })

    // Fetch quotes
    const { data: quotes } = await auth.admin
      .from('quotes')
      .select('id, status, total_amount, created_at')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.user.tenantId)
      .order('created_at', { ascending: false })

    // Fetch customer-visible daily logs
    const { data: dailyLogs } = await auth.admin
      .from('daily_logs')
      .select('id, log_date, summary, weather, temperature_c, workers_on_site, work_performed, materials_used, issues, photos, created_at')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.user.tenantId)
      .eq('visible_to_customer', true)
      .order('log_date', { ascending: false })

    return apiSuccess({
      project,
      documents: visibleDocs,
      invoices: invoices ?? [],
      quotes: quotes ?? [],
      daily_logs: dailyLogs ?? [],
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
