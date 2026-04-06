import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateCommentSchema = z.object({
  body: z.string().min(1, 'Kommentar krävs'),
  photos: z.array(z.string()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseId: string }> }
) {
  try {
    const { caseId } = await params
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: caseRecord } = await auth.admin
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!caseRecord) return apiError('Ärende hittades inte', 404)

    const body = await parseBody(request, CreateCommentSchema)
    if (body.error) return body.error

    const { data: emp } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .single()

    const { data, error } = await auth.admin
      .from('case_comments')
      .insert({
        case_id: caseId,
        author_id: emp?.id || auth.user.id,
        body: body.data.body,
        photos: body.data.photos || [],
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess({ comment: data }, 201)
  } catch (err) {
    return handleRouteError(err)
  }
}
