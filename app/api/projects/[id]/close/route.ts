import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params

    // Verify user is admin
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (employee?.role !== 'admin') {
      return apiError('Unauthorized: Admin access required', 403)
    }

    // Check that project exists
    const { data: project, error: projError } = await auth.admin
      .from('projects')
      .select('id, name, status')
      .eq('id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (projError || !project) return apiError('Project not found', 404)

    // Check if all required documents have been uploaded
    const { data: requiredDocs, error: docsError } = await auth.admin
      .from('project_documents')
      .select('id, file_name, file_path')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .eq('is_required', true)

    if (docsError) return apiError('Failed to check required documents', 500)

    const missingDocs = (requiredDocs ?? []).filter((doc) => !doc.file_path)

    if (missingDocs.length > 0) {
      return apiError(
        `Kan inte stänga projektet. ${missingDocs.length} obligatoriska dokument saknas: ${missingDocs.map((d) => d.file_name).join(', ')}`,
        400
      )
    }

    // Update project status to completed
    const { data: updated, error: updateError } = await auth.admin
      .from('projects')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (updateError || !updated) return apiError('Failed to close project', 500)

    return apiSuccess(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
