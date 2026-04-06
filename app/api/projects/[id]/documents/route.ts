import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, parseSearchParams, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { hasRestrictedFolderAccess, isRestrictedFolder } from '@/lib/documents/folders'

const ListQuerySchema = z.object({
  folder: z.string().optional(),
  search: z.string().optional(),
})

const CreateDocSchema = z.object({
  folder: z.string().min(1),
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().int().optional(),
  mime_type: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_required: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params
    const parsed = parseSearchParams(req, ListQuerySchema)
    if (parsed.error) return parsed.error

    let query = auth.admin
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    const binderTabId = new URL(req.url).searchParams.get('binder_tab_id')

    if (parsed.data.folder) {
      query = query.eq('folder', parsed.data.folder)
    }

    if (binderTabId) query = query.eq('binder_tab_id', binderTabId)

    if (parsed.data.search) {
      query = query.ilike('file_name', `%${parsed.data.search}%`)
    }

    const { data, error } = await query

    if (error) return apiError('Failed to fetch documents', 500)

    return apiSuccess(data ?? [])
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
    const parsed = await parseBody(req, CreateDocSchema)
    if (parsed.error) return parsed.error

    // Check restricted folder permissions
    if (isRestrictedFolder(parsed.data.folder)) {
      const { data: employee } = await auth.admin
        .from('employees')
        .select('role')
        .eq('auth_user_id', auth.user.id)
        .eq('tenant_id', auth.tenantId)
        .maybeSingle()

      if (!hasRestrictedFolderAccess(employee?.role)) {
        return apiError('Admin access required for restricted folders', 403)
      }
    }

    // Find employee for uploaded_by
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const { data: doc, error: insertError } = await auth.admin
      .from('project_documents')
      .insert({
        tenant_id: auth.tenantId,
        project_id: projectId,
        folder: parsed.data.folder,
        file_name: parsed.data.file_name,
        file_path: parsed.data.file_path,
        file_size: parsed.data.file_size ?? null,
        mime_type: parsed.data.mime_type ?? null,
        description: parsed.data.description ?? null,
        tags: parsed.data.tags ?? [],
        is_required: parsed.data.is_required ?? false,
        uploaded_by: employee?.id ?? null,
      })
      .select()
      .single()

    if (insertError || !doc) return apiError('Failed to create document', 500)

    return apiSuccess(doc, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
