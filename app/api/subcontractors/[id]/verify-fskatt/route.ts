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

    // Skatteverket F-skatt API requires organizational certificate — not yet integrated.
    // Instead of faking verification, flag for manual check.
    console.log(`[F-skatt] Automatic verification unavailable for ${sub.company_name} (org: ${sub.org_number ?? 'N/A'}) — flagging manual check`)

    const now = new Date().toISOString()

    const { data, error } = await auth.admin
      .from('subcontractors')
      .update({
        f_skatt_verified: false,
        fskatt_status: 'manual_check_required',
        updated_at: now,
      })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error) return apiError(error.message || 'Failed to update F-skatt status', 500)

    return apiSuccess({
      verified: false,
      manual_check_required: true,
      message: 'Automatisk F-skatt-verifiering är inte tillgänglig. Kontrollera F-skattsedel manuellt på skatteverket.se.',
      subcontractor: data,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
