import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageTemplates } from '@/lib/binders/permissions'

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('binder_templates')
      .select('id, name, description, structure, is_default, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('name', { ascending: true })

    if (error) return apiError(error.message, 500)
    return apiSuccess({ templates: data || [] })
  } catch (err) {
    return handleRouteError(err)
  }
}

const CreateBinderTemplateSchema = z.object({
  name: z.string().min(1, 'Namn krävs'),
  description: z.string().optional(),
  structure: z.object({
    tabs: z.array(z.object({
      name: z.string().min(1),
      key: z.string().min(1),
      icon: z.string().optional(),
      restricted: z.boolean().default(false),
    })),
  }),
  isDefault: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!canManageTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, CreateBinderTemplateSchema)
    if (body.error) return body.error

    if (body.data.isDefault) {
      await auth.admin
        .from('binder_templates')
        .update({ is_default: false })
        .eq('tenant_id', auth.tenantId)
        .eq('is_default', true)
    }

    const { data, error } = await auth.admin
      .from('binder_templates')
      .insert({
        tenant_id: auth.tenantId,
        name: body.data.name,
        description: body.data.description || null,
        structure: body.data.structure,
        is_default: body.data.isDefault,
        created_by: emp?.id || auth.user.id,
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess({ template: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
