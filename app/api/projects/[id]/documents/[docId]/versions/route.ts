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

    // Fetch the document to get its file_name and folder
    const { data: doc } = await auth.admin
      .from('project_documents')
      .select('file_name, folder')
      .eq('id', docId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!doc) return apiError('Document not found', 404)

    // Fetch all versions of this file
    const { data: versions, error } = await auth.admin
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .eq('file_name', doc.file_name)
      .eq('folder', doc.folder)
      .order('version', { ascending: false })

    if (error) return apiError('Failed to fetch versions', 500)

    return apiSuccess(versions ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}
