import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const AnnotationSchema = z.object({
  page_number: z.number().int().positive().default(1),
  annotation_type: z.enum(['cloud', 'arrow', 'text', 'highlight', 'measurement', 'pin']),
  data: z.record(z.unknown()),
  work_order_id: z.string().uuid().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { docId } = await params
    const pageNumber = req.nextUrl.searchParams.get('page_number')

    let q = auth.admin
      .from('document_annotations')
      .select('*')
      .eq('document_id', docId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: true })

    if (pageNumber) {
      q = q.eq('page_number', Number(pageNumber))
    }

    const { data, error } = await q

    if (error) return apiError(error.message || 'Failed to fetch annotations', 500)

    return apiSuccess(data ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof AnnotationSchema>
    try {
      parsed = AnnotationSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId, docId } = await params

    // Verify document exists and belongs to this project/tenant
    const { data: doc } = await auth.admin
      .from('project_documents')
      .select('id')
      .eq('id', docId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!doc) return apiError('Document not found', 404)

    // Resolve employee for created_by
    const { data: employee } = await auth.admin
      .from('employees')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    const { data, error } = await auth.admin
      .from('document_annotations')
      .insert({
        tenant_id: auth.tenantId,
        document_id: docId,
        page_number: parsed.page_number,
        annotation_type: parsed.annotation_type,
        data: parsed.data,
        work_order_id: parsed.work_order_id ?? null,
        created_by: employee?.id ?? null,
      })
      .select()
      .single()

    if (error) return apiError(error.message || 'Failed to create annotation', 500)

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    await params // consume params
    const annotationId = req.nextUrl.searchParams.get('annotation_id')

    if (!annotationId) return apiError('annotation_id query param required', 400)

    const { error } = await auth.admin
      .from('document_annotations')
      .delete()
      .eq('id', annotationId)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message || 'Failed to delete annotation', 500)

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
