import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateCertificateSchema = z.object({
  employee_id: z.string().uuid(),
  certificate_type: z.string().min(1),
  certificate_name: z.string().min(1),
  issuer: z.string().optional(),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  document_url: z.string().url().optional(),
})

function computeStatus(expiryDate: string | undefined): string {
  if (!expiryDate) return 'valid'
  const now = new Date()
  const expiry = new Date(expiryDate)
  if (expiry < now) return 'expired'
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (expiry < thirtyDays) return 'expiring_soon'
  return 'valid'
}

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const employeeId = req.nextUrl.searchParams.get('employee_id')

    let q = auth.admin
      .from('employee_certificates')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('expiry_date', { ascending: true })

    if (employeeId) q = q.eq('employee_id', employeeId)

    const { data, error } = await q

    if (error) return apiError(error.message || 'Failed to fetch certificates', 500)

    return apiSuccess(data ?? [])
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    let parsed: z.infer<typeof CreateCertificateSchema>
    try {
      parsed = CreateCertificateSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const status = computeStatus(parsed.expiry_date)

    const { data, error } = await auth.admin
      .from('employee_certificates')
      .insert({
        tenant_id: auth.tenantId,
        employee_id: parsed.employee_id,
        certificate_type: parsed.certificate_type,
        certificate_name: parsed.certificate_name,
        issuer: parsed.issuer ?? null,
        issued_date: parsed.issued_date ?? null,
        expiry_date: parsed.expiry_date ?? null,
        document_url: parsed.document_url ?? null,
        status,
      })
      .select()
      .single()

    if (error) return apiError(error.message || 'Failed to create certificate', 500)

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
