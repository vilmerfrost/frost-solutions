import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

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
    const priority = url.searchParams.get('priority')
    const assignedTo = url.searchParams.get('assigned_to')

    let query = auth.admin
      .from('cases')
      .select('id, title, description, status, priority, assigned_to, created_by, source_type, source_id, due_date, resolved_at, photos, created_at')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    const { data, error } = await query
    if (error) return apiError(error.message, 500)
    return apiSuccess({ cases: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateCaseSchema = z.object({
  title: z.string().min(1, 'Titel krävs'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  photos: z.array(z.string()).optional(),
  sourceType: z.enum(['manual', 'checklist', 'annotation']).default('manual'),
  sourceId: z.string().uuid().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, CreateCaseSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const { data, error } = await auth.admin
      .from('cases')
      .insert({
        tenant_id: auth.tenantId,
        project_id: projectId,
        title: body.data.title,
        description: body.data.description || null,
        status: 'ny',
        priority: body.data.priority,
        assigned_to: body.data.assignedTo || null,
        created_by: emp?.id || auth.user.id,
        source_type: body.data.sourceType,
        source_id: body.data.sourceId || null,
        due_date: body.data.dueDate || null,
        photos: body.data.photos || [],
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess({ case: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
