import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const AttachDocSchema = z.object({
  document_id: z.string().uuid(),
})

/**
 * GET /api/ata/v2/[id]/documents
 * List documents attached to this ÄTA (stored in 07-KMA folder with ÄTA prefix)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: ataId } = await params

    // Verify ÄTA exists
    const { data: ata } = await auth.admin
      .from('rot_applications')
      .select('id, project_id')
      .eq('id', ataId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!ata) return apiError('ÄTA not found', 404)

    // Fetch documents tagged with this ÄTA's KMA folder
    const ataFolder = `07-KMA/ATA-${ataId}`
    const { data: documents } = await auth.admin
      .from('project_documents')
      .select('*')
      .eq('project_id', ata.project_id)
      .eq('tenant_id', auth.tenantId)
      .eq('folder', ataFolder)
      .order('created_at', { ascending: false })

    return apiSuccess(documents ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}

/**
 * POST /api/ata/v2/[id]/documents
 * Attach a project document to this ÄTA by copying its reference into the ÄTA's KMA folder
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: ataId } = await params
    const parsed = await parseBody(req, AttachDocSchema)
    if (parsed.error) return parsed.error

    // Verify ÄTA exists
    const { data: ata } = await auth.admin
      .from('rot_applications')
      .select('id, project_id')
      .eq('id', ataId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!ata) return apiError('ÄTA not found', 404)

    // Verify source document exists
    const { data: sourceDoc } = await auth.admin
      .from('project_documents')
      .select('*')
      .eq('id', parsed.data.document_id)
      .eq('project_id', ata.project_id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!sourceDoc) return apiError('Document not found', 404)

    // Find employee
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    // Create a reference in the ÄTA's KMA folder
    const ataFolder = `07-KMA/ATA-${ataId}`
    const { data: linked, error: insertError } = await auth.admin
      .from('project_documents')
      .insert({
        tenant_id: auth.tenantId,
        project_id: ata.project_id,
        folder: ataFolder,
        file_name: sourceDoc.file_name,
        file_path: sourceDoc.file_path,
        file_size: sourceDoc.file_size,
        mime_type: sourceDoc.mime_type,
        version: 1,
        uploaded_by: employee?.id ?? null,
        description: `Linked from ${sourceDoc.folder}: ${sourceDoc.description ?? sourceDoc.file_name}`,
        tags: [...(sourceDoc.tags ?? []), `ata:${ataId}`],
      })
      .select()
      .single()

    if (insertError || !linked) return apiError('Failed to attach document', 500)

    return apiSuccess(linked, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
