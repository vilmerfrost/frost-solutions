import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canCreateChecklistTemplates } from '@/lib/binders/permissions'

const UpdateChecklistTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  structure: z.object({
    sections: z.array(z.object({
      name: z.string().min(1),
      items: z.array(z.object({
        label: z.string().min(1),
        type: z.enum(['yes_no', 'measurement', 'dropdown', 'text']),
        config: z.record(z.string(), z.unknown()).optional(),
      })),
    })),
  }).optional(),
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

    if (!canCreateChecklistTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const body = await parseBody(request, UpdateChecklistTemplateSchema)
    if (body.error) return body.error

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.data.name !== undefined) updateData.name = body.data.name
    if (body.data.description !== undefined) updateData.description = body.data.description
    if (body.data.category !== undefined) updateData.category = body.data.category
    if (body.data.structure !== undefined) updateData.structure = body.data.structure

    const { data, error } = await auth.admin
      .from('checklist_templates')
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

    if (!canCreateChecklistTemplates(emp?.role ?? null)) {
      return apiError('Behörighet saknas', 403)
    }

    const { error } = await auth.admin
      .from('checklist_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message, 500)
    return apiSuccess({ deleted: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
