import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export async function GET(_req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { data, error } = await auth.admin
      .from('employee_certificates')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .lte('expiry_date', thirtyDays.toISOString().split('T')[0])
      .gte('expiry_date', now.toISOString().split('T')[0])
      .neq('status', 'revoked')
      .order('expiry_date', { ascending: true })

    if (error) return apiError(error.message || 'Failed to fetch expiring certificates', 500)

    // Also fetch already expired ones
    const { data: expired, error: expiredError } = await auth.admin
      .from('employee_certificates')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .lt('expiry_date', now.toISOString().split('T')[0])
      .neq('status', 'revoked')
      .order('expiry_date', { ascending: true })

    if (expiredError) return apiError(expiredError.message || 'Failed to fetch expired certificates', 500)

    return apiSuccess({
      expiring_soon: data ?? [],
      expired: expired ?? [],
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
