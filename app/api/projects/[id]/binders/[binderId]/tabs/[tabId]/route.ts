import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageBinders } from '@/lib/binders/permissions'

const UpdateTabSchema = z.object({
  name: z.string().min(1).optional(),
  sort_order: z.number().int().min(0).optional(),
  config: z.object({
    icon: z.string().optional(),
    color: z.string().optional(),
    restricted_roles: z.array(z.string()).optional(),
  }).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string; tabId: string }> }
) {
  try {
    const { binderId, tabId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, UpdateTabSchema)
    if (body.error) return body.error

    const { data, error } = await auth.admin
      .from('binder_tabs')
      .update(body.data)
      .eq('id', tabId)
      .eq('binder_id', binderId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Flik hittades inte', 404)

    return apiSuccess({ tab: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string; tabId: string }> }
) {
  try {
    const { binderId, tabId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageBinders(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const { error } = await auth.admin
      .from('binder_tabs')
      .delete()
      .eq('id', tabId)
      .eq('binder_id', binderId)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message, 500)

    return apiSuccess({ deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
