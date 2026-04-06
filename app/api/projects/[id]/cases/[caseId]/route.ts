import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { canManageCases, isValidTransition } from '@/lib/cases/utils'
import type { CaseStatus } from '@/lib/cases/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { caseId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('cases')
      .select(`
        id, title, description, status, priority, assigned_to, created_by,
        source_type, source_id, due_date, resolved_at, photos, created_at, updated_at,
        case_comments ( id, author_id, body, photos, created_at )
      `)
      .eq('id', caseId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Ärende hittades inte', 404)

    if (data.case_comments) {
      (data.case_comments as any[]).sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }

    return apiSuccess({ case: data })
  } catch (err) {
    return handleRouteError(err)
  }
}

const UpdateCaseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['ny', 'pagaende', 'atgardad', 'godkand']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { caseId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(request, UpdateCaseSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (body.data.status || body.data.assignedTo !== undefined) {
      if (!canManageCases(emp?.role ?? null)) {
        return apiError('Behörighet saknas', 403)
      }
    }

    if (body.data.status) {
      const { data: current } = await auth.admin
        .from('cases')
        .select('status')
        .eq('id', caseId)
        .eq('tenant_id', auth.tenantId)
        .single()

      if (current && !isValidTransition(current.status as CaseStatus, body.data.status)) {
        return apiError(`Ogiltig statusändring: ${current.status} → ${body.data.status}`, 400)
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.data.title !== undefined) updateData.title = body.data.title
    if (body.data.description !== undefined) updateData.description = body.data.description
    if (body.data.status !== undefined) {
      updateData.status = body.data.status
      if (body.data.status === 'atgardad' || body.data.status === 'godkand') {
        updateData.resolved_at = new Date().toISOString()
      }
    }
    if (body.data.priority !== undefined) updateData.priority = body.data.priority
    if (body.data.assignedTo !== undefined) updateData.assigned_to = body.data.assignedTo
    if (body.data.dueDate !== undefined) updateData.due_date = body.data.dueDate
    if (body.data.photos !== undefined) updateData.photos = body.data.photos

    const { data, error } = await auth.admin
      .from('cases')
      .update(updateData)
      .eq('id', caseId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Ärende hittades inte', 404)

    return apiSuccess({ case: data })
  } catch (err) {
    return handleRouteError(err)
  }
}
