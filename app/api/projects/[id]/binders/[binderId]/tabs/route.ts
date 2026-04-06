import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageBinders } from '@/lib/binders/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string }> }
) {
  try {
    const { binderId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('binder_tabs')
      .select('id, name, key, sort_order, config')
      .eq('binder_id', binderId)
      .eq('tenant_id', auth.tenantId)
      .order('sort_order', { ascending: true })

    if (error) return apiError(error.message, 500)

    return apiSuccess({ tabs: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateTabSchema = z.object({
  name: z.string().min(1, 'Tab name required'),
  key: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens'),
  config: z.object({
    icon: z.string().optional(),
    color: z.string().optional(),
    restricted_roles: z.array(z.string()).optional(),
  }).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binderId: string }> }
) {
  try {
    const { binderId } = await params
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

    const body = await parseBody(request, CreateTabSchema)
    if (body.error) return body.error

    const { data: existing } = await auth.admin
      .from('binder_tabs')
      .select('sort_order')
      .eq('binder_id', binderId)
      .eq('tenant_id', auth.tenantId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { data, error } = await auth.admin
      .from('binder_tabs')
      .insert({
        tenant_id: auth.tenantId,
        binder_id: binderId,
        name: body.data.name,
        key: body.data.key,
        sort_order: nextOrder,
        config: body.data.config || {},
        created_by: emp?.id || auth.user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return apiError('En flik med den nyckeln finns redan', 409)
      return apiError(error.message, 500)
    }

    return apiSuccess({ tab: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
