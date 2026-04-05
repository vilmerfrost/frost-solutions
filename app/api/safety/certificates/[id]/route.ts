import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const UpdateCertificateSchema = z.object({
  certificate_type: z.string().min(1).optional(),
  certificate_name: z.string().min(1).optional(),
  issuer: z.string().optional(),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  document_url: z.string().url().optional(),
  status: z.enum(['valid', 'expiring_soon', 'expired', 'revoked']).optional(),
})

function computeStatus(expiryDate: string | undefined | null): string {
  if (!expiryDate) return 'valid'
  const now = new Date()
  const expiry = new Date(expiryDate)
  if (expiry < now) return 'expired'
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (expiry < thirtyDays) return 'expiring_soon'
  return 'valid'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    const { data, error } = await auth.admin
      .from('employee_certificates')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error || !data) return apiError('Certificate not found', 404)

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

    let parsed: z.infer<typeof UpdateCertificateSchema>
    try {
      parsed = UpdateCertificateSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    const updateData: Record<string, unknown> = { ...parsed, updated_at: new Date().toISOString() }

    // Auto-compute status if expiry_date changes and status not explicitly set
    if (parsed.expiry_date && !parsed.status) {
      updateData.status = computeStatus(parsed.expiry_date)
    }

    const { data, error } = await auth.admin
      .from('employee_certificates')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error || !data) return apiError('Certificate not found', 404)

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
      .from('employee_certificates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)

    if (error) return apiError(error.message || 'Failed to delete certificate', 500)

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
