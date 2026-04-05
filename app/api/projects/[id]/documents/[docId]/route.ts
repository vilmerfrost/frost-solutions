import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId, docId } = await params

    const { data: doc, error } = await auth.admin
      .from('project_documents')
      .select('*')
      .eq('id', docId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error || !doc) return apiError('Document not found', 404)

    return apiSuccess(doc)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId, docId } = await params

    // Fetch doc to get storage path
    const { data: doc } = await auth.admin
      .from('project_documents')
      .select('file_path')
      .eq('id', docId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!doc) return apiError('Document not found', 404)

    // Delete from storage
    await auth.admin.storage.from('project-documents').remove([doc.file_path])

    // Delete record
    const { error: deleteError } = await auth.admin
      .from('project_documents')
      .delete()
      .eq('id', docId)
      .eq('tenant_id', auth.tenantId)

    if (deleteError) return apiError('Failed to delete document', 500)

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
