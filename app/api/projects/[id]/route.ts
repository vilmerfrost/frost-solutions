// app/api/projects/[id]/route.ts
import { NextRequest } from 'next/server'
import { resolveAuth, resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    if (!projectId) {
      return apiError('Project ID is required', 400)
    }

    const auth = await resolveAuth()
    if (auth.error) return auth.error

    const supabase = createClient()

    // Try to fetch project with client info
    let { data: project, error } = await supabase
      .from('projects')
      .select('*, clients(id, name, org_number), client_id')
      .eq('id', projectId)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    // If error about org_number, retry without it
    if (error && error.message?.includes('org_number')) {
      const retry = await supabase
        .from('projects')
        .select('*, clients(id, name), client_id')
        .eq('id', projectId)
        .eq('tenant_id', auth.tenantId)
        .maybeSingle()

      if (!retry.error && retry.data) {
        project = retry.data
        error = null
      } else {
        error = retry.error
      }
    }

    if (error) {
      console.error('Error fetching project:', error)
      return apiError(error.message, 500)
    }

    if (!project) {
      return apiError('Project not found', 404)
    }

    return apiSuccess({ project })
  } catch (err) {
    return handleRouteError(err)
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project permanently (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params
    if (!projectId) {
      return apiError('Project ID is required', 400)
    }

    // Verify user is admin
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id, role, tenant_id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (employee?.role !== 'admin') {
      return apiError('Unauthorized: Admin access required', 403)
    }

    // Fetch project to verify it exists and belongs to tenant
    const { data: project, error: fetchError } = await auth.admin
      .from('projects')
      .select('id, name, tenant_id')
      .eq('id', projectId)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (fetchError || !project) {
      return apiError('Project not found', 404)
    }

    // Check if project has invoices
    const { data: invoices, error: invoicesError } = await auth.admin
      .from('invoices')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)

    if (!invoicesError && invoices && invoices.length > 0) {
      return apiError(
        'Projektet har associerade fakturor och kan inte tas bort. Arkivera projektet istallet.',
        400
      )
    }

    // Delete related time entries first (or set project_id to null)
    const { error: timeEntriesError } = await auth.admin
      .from('time_entries')
      .delete()
      .eq('project_id', projectId)

    if (timeEntriesError) {
      console.warn('Warning: Could not delete time entries:', timeEntriesError)
      // Try to unlink instead
      await auth.admin
        .from('time_entries')
        .update({ project_id: null })
        .eq('project_id', projectId)
    }

    // Delete project_employees relations
    await auth.admin
      .from('project_employees')
      .delete()
      .eq('project_id', projectId)

    // Delete budget_alerts
    await auth.admin
      .from('budget_alerts')
      .delete()
      .eq('project_id', projectId)

    // Delete project
    const { error: deleteError } = await auth.admin
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('tenant_id', auth.tenantId)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return apiError(deleteError.message || 'Failed to delete project', 500)
    }

    console.log(`Project "${project.name}" (${projectId}) deleted by user ${auth.user.id}`)

    return apiSuccess({
      success: true,
      message: `Projektet "${project.name}" har tagits bort`,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
