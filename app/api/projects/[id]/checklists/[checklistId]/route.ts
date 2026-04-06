import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canSignOffChecklist } from '@/lib/binders/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { checklistId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('checklists')
      .select(`
        id, name, status, assigned_to, template_id,
        signed_by, signed_at, signature_data, created_at, updated_at,
        checklist_items (
          id, section, sort_order, label, item_type, config,
          value, status, comment, photo_path, case_id
        )
      `)
      .eq('id', checklistId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Egenkontroll hittades inte', 404)

    if (data.checklist_items) {
      (data.checklist_items as any[]).sort((a, b) => a.sort_order - b.sort_order)
    }

    return apiSuccess({ checklist: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

const UpdateChecklistSchema = z.object({
  status: z.enum(['draft', 'in_progress', 'completed', 'signed_off']).optional(),
  name: z.string().min(1).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  signatureData: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { checklistId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, UpdateChecklistSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.data.name !== undefined) updateData.name = body.data.name
    if (body.data.assignedTo !== undefined) updateData.assigned_to = body.data.assignedTo
    if (body.data.status !== undefined) updateData.status = body.data.status

    if (body.data.status === 'signed_off') {
      if (!canSignOffChecklist(emp?.role ?? null)) {
        return apiError('Behörighet saknas för signering', 403)
      }
      updateData.signed_by = emp?.id || auth.user.id
      updateData.signed_at = new Date().toISOString()
      if (body.data.signatureData) {
        updateData.signature_data = body.data.signatureData
      }
    }

    const { data, error } = await auth.admin
      .from('checklists')
      .update(updateData)
      .eq('id', checklistId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Egenkontroll hittades inte', 404)

    return apiSuccess({ checklist: data })
  } catch (err) {
    return handleRouteError(err)
  }
}
