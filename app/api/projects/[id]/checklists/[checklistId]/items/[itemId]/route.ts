import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createCaseFromChecklistItem } from '@/lib/cases/utils'

const UpdateItemSchema = z.object({
  value: z.string().nullable().optional(),
  status: z.enum(['pending', 'ok', 'fail', 'na']).optional(),
  comment: z.string().nullable().optional(),
  photoPath: z.string().nullable().optional(),
  createCase: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string; itemId: string }> }
) {
  try {
    const { id: projectId, checklistId, itemId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, UpdateItemSchema)
    if (body.error) return body.error

    const { data: checklist } = await auth.admin
      .from('checklists')
      .select('id, tenant_id')
      .eq('id', checklistId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!checklist) return apiError('Egenkontroll hittades inte', 404)

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.data.value !== undefined) updateData.value = body.data.value
    if (body.data.status !== undefined) updateData.status = body.data.status
    if (body.data.comment !== undefined) updateData.comment = body.data.comment
    if (body.data.photoPath !== undefined) updateData.photo_path = body.data.photoPath

    if (body.data.createCase && body.data.status === 'fail') {
      const { data: item } = await auth.admin
        .from('checklist_items')
        .select('label, case_id')
        .eq('id', itemId)
        .single()

      if (item && !item.case_id) {
        const { data: emp } = await auth.admin
          .from('employees')
          .select('id')
          .eq('auth_user_id', auth.user.id)
          .eq('tenant_id', auth.tenantId)
          .single()

        const caseResult = await createCaseFromChecklistItem(auth.admin, {
          tenantId: auth.tenantId,
          projectId,
          checklistItemId: itemId,
          itemLabel: item.label,
          createdBy: emp?.id || auth.user.id,
        })

        if ('caseId' in caseResult) {
          updateData.case_id = caseResult.caseId
        }
      }
    }

    const { data, error } = await auth.admin
      .from('checklist_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('checklist_id', checklistId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Kontrollpunkt hittades inte', 404)

    return apiSuccess({ item: data })
  } catch (err) {
    return handleRouteError(err)
  }
}
