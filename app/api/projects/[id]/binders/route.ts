import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageBinders } from '@/lib/binders/permissions'
import { createBinderFromTemplate, createEmptyBinder } from '@/lib/binders/templates'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('binders')
      .select(`
        id, name, sort_order, template_id, created_at,
        binder_tabs ( id, name, key, sort_order, config )
      `)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .order('sort_order', { ascending: true })

    if (error) return apiError(error.message, 500)

    return apiSuccess({ binders: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateBinderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  templateId: z.string().uuid().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, CreateBinderSchema)
    if (body.error) return body.error

    const { name, templateId } = body.data

    if (templateId) {
      const result = await createBinderFromTemplate(auth.admin, {
        tenantId: auth.tenantId,
        projectId,
        templateId,
        name,
        createdBy: emp?.id || auth.user.id,
      })
      if ('error' in result) return apiError(result.error, 400)
      return apiSuccess({ binderId: result.binderId }, 201)
    }

    const result = await createEmptyBinder(auth.admin, {
      tenantId: auth.tenantId,
      projectId,
      name,
      createdBy: emp?.id || auth.user.id,
    })
    if ('error' in result) return apiError(result.error, 400)
    return apiSuccess({ binderId: result.binderId }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
