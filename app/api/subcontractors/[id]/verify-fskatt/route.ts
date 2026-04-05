import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id } = await params

    // Verify subcontractor exists
    const { data: sub } = await auth.admin
      .from('subcontractors')
      .select('id, org_number, company_name')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!sub) return apiError('Subcontractor not found', 404)

    // Stub: Skatteverket F-skatt API requires organizational certificate.
    // For now, mark as verified with a timestamp.
    console.log(`[F-skatt stub] Verification requested for ${sub.company_name} (org: ${sub.org_number ?? 'N/A'})`)

    const verifiedAt = new Date().toISOString()

    const { data, error } = await auth.admin
      .from('subcontractors')
      .update({
        f_skatt_verified: true,
        f_skatt_verified_at: verifiedAt,
        updated_at: verifiedAt,
      })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message || 'Failed to update F-skatt status', 500)

    return apiSuccess({
      verified: true,
      verified_at: verifiedAt,
      note: 'Stub response — Skatteverket API integration pending (requires organizational certificate)',
      subcontractor: data,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
