import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageTemplates } from '@/lib/binders/permissions'

const UpdateBinderTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  structure: z.object({
    tabs: z.array(z.object({
      name: z.string().min(1),
      key: z.string().min(1),
      icon: z.string().optional(),
      restricted: z.boolean().default(false),
    })),
  }).optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const body = await parseBody(request, UpdateBinderTemplateSchema)
    if (body.error) return body.error

    if (body.data.isDefault) {
      await auth.admin
        .from('binder_templates')
        .update({ is_default: false })
        .eq('tenant_id', auth.tenantId)
        .eq('is_default', true)
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.data.name !== undefined) updateData.name = body.data.name
    if (body.data.description !== undefined) updateData.description = body.data.description
    if (body.data.structure !== undefined) updateData.structure = body.data.structure
    if (body.data.isDefault !== undefined) updateData.is_default = body.data.isDefault

    const { data, error } = await auth.admin
      .from('binder_templates')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Mall hittades inte', 404)
    return apiSuccess({ template: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { error } = await auth.admin
      .from('binder_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message, 500)
    return apiSuccess({ deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
