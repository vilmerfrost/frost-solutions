import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateSubcontractorSchema = z.object({
  company_name: z.string().min(1),
  org_number: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  insurance_verified: z.boolean().optional(),
  insurance_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const active = req.nextUrl.searchParams.get('active')

    let q = auth.admin
      .from('subcontractors')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('company_name', { ascending: true })

    if (active !== null) q = q.eq('active', active === 'true')

    const { data, error } = await q

    if (error) return apiError(error.message || 'Failed to fetch subcontractors', 500)

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

    let parsed: z.infer<typeof CreateSubcontractorSchema>
    try {
      parsed = CreateSubcontractorSchema.parse(body)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(e.issues[0]?.message ?? 'Invalid payload', 400)
      }
      throw e
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data, error } = await auth.admin
      .from('subcontractors')
      .insert({
        tenant_id: auth.tenantId,
        company_name: parsed.company_name,
        org_number: parsed.org_number ?? null,
        contact_name: parsed.contact_name ?? null,
        contact_email: parsed.contact_email ?? null,
        contact_phone: parsed.contact_phone ?? null,
        insurance_verified: parsed.insurance_verified ?? false,
        insurance_expiry: parsed.insurance_expiry ?? null,
        notes: parsed.notes ?? null,
      })
      .select()
      .single()

    if (error) return apiError(error.message || 'Failed to create subcontractor', 500)

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
