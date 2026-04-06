import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { instantiateChecklist } from '@/lib/checklists/templates'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const assignedTo = url.searchParams.get('assigned_to')

    let query = auth.admin
      .from('checklists')
      .select('id, name, status, assigned_to, template_id, signed_by, signed_at, created_at, updated_at')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    const { data, error } = await query

    if (error) return apiError(error.message, 500)

    return apiSuccess({ checklists: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateChecklistSchema = z.object({
  templateId: z.string().uuid(),
  assignedTo: z.string().uuid().optional(),
  binderTabId: z.string().uuid().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, CreateChecklistSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const result = await instantiateChecklist(auth.admin, {
      tenantId: auth.tenantId,
      projectId,
      templateId: body.data.templateId,
      assignedTo: body.data.assignedTo,
      binderTabId: body.data.binderTabId,
      createdBy: emp?.id || auth.user.id,
    })

    if ('error' in result) return apiError(result.error, 400)

    return apiSuccess({ checklistId: result.checklistId }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
