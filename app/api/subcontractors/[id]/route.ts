import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const UpdateSubcontractorSchema = z.object({
  company_name: z.string().min(1).optional(),
  org_number: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  insurance_verified: z.boolean().optional(),
  insurance_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    const { data, error } = await auth.admin
      .from('subcontractors')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error || !data) return apiError('Subcontractor not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof UpdateSubcontractorSchema>
    try {
      parsed = UpdateSubcontractorSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    const { data, error } = await auth.admin
      .from('subcontractors')
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error || !data) return apiError('Subcontractor not found', 404)

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    const { error } = await auth.admin
      .from('subcontractors')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message || 'Failed to delete subcontractor', 500)

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
