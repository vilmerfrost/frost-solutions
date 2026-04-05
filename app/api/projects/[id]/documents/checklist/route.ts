import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const MarkRequiredSchema = z.object({
  fileName: z.string().min(1),
  folder: z.string().min(1),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params

    const { data, error } = await auth.admin
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .eq('is_required', true)
      .order('file_name', { ascending: true })

    if (error) return apiError('Failed to fetch checklist', 500)

    const checklist = (data ?? []).map((doc) => ({
      ...doc,
      uploaded: !!doc.file_path,
    }))

    return apiSuccess(checklist)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params
    const parsed = await parseBody(req, MarkRequiredSchema)
    if (parsed.error) return parsed.error

    const { data: doc, error: insertError } = await auth.admin
      .from('project_documents')
      .insert({
        tenant_id: auth.tenantId,
        project_id: projectId,
        folder: parsed.data.folder,
        file_name: parsed.data.fileName,
        file_path: null,
        is_required: true,
        tags: [],
      })
      .select()
      .single()

    if (insertError || !doc) return apiError('Failed to create required document entry', 500)

    return apiSuccess(doc, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
