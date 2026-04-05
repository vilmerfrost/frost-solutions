import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { isRestrictedFolder } from '@/lib/documents/folders'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || '06-Foton'
    const description = formData.get('description') as string | null

    if (!file) return apiError('No file provided', 400)

    // Check restricted folder permissions
    if (isRestrictedFolder(folder)) {
      const { data: empRole } = await auth.admin
        .from('employees')
        .select('role')
        .eq('auth_user_id', auth.user.id)
        .eq('tenant_id', auth.tenantId)
        .single()

      if (empRole?.role !== 'admin') {
        return apiError('Admin access required for restricted folders', 403)
      }
    }

    // Check for existing file with same name in same folder (auto-versioning)
    const { data: existing } = await auth.admin
      .from('project_documents')
      .select('id, version')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .eq('folder', folder)
      .eq('file_name', file.name)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const newVersion = existing ? existing.version + 1 : 1
    const storagePath = `${auth.tenantId}/${projectId}/${folder}/${file.name}_v${newVersion}`

    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await auth.admin.storage
      .from('project-documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return apiError(`Upload failed: ${uploadError.message}`, 500)
    }

    // Find employee
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    // Create project_documents record
    const { data: doc, error: insertError } = await auth.admin
      .from('project_documents')
      .insert({
        tenant_id: auth.tenantId,
        project_id: projectId,
        folder,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        version: newVersion,
        previous_version_id: existing?.id ?? null,
        uploaded_by: employee?.id ?? null,
        description: description ?? null,
      })
      .select()
      .single()

    if (insertError || !doc) {
      return apiError('Failed to create document record', 500)
    }

    return apiSuccess(doc, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
