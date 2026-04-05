// app/api/employees/list/route.ts
import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

/**
 * GET /api/employees/list
 * Fetches all employees for the current tenant
 * Uses service role to bypass RLS
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { data: employees, error } = await auth.admin
      .from('employees')
      .select('id, full_name, email, role, base_rate_sek, name, auth_user_id')
      .eq('tenant_id', auth.tenantId)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error fetching employees:', error)
      return apiError(error.message || 'Failed to fetch employees', 500)
    }

    return apiSuccess({ employees: employees || [] })
  } catch (error) {
    return handleRouteError(error)
  }
}
