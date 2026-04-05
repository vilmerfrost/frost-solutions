import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { checkRateLimit, getClientIP } from '@/lib/security'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientIP = getClientIP(req as unknown as Request)
    const rateLimit = checkRateLimit(`resend_invite:${clientIP}`, 5, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return apiError('För många förfrågningar. Försök igen senare.', 429)
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: employeeId } = await params

    // Verify caller is admin
    const { data: callerData } = await auth.admin
      .from('employees')
      .select('role')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (!callerData || !['admin', 'Admin', 'ADMIN'].includes(callerData.role)) {
      return apiError('Admin access required', 403)
    }

    // Fetch employee
    const { data: employee, error: fetchError } = await auth.admin
      .from('employees')
      .select('id, email, auth_user_id, full_name, name')
      .eq('id', employeeId)
      .eq('tenant_id', auth.tenantId)
      .maybeSingle()

    if (fetchError || !employee) {
      return apiError('Anställd hittades inte', 404)
    }

    if (!employee.email) {
      return apiError('Anställd saknar e-postadress', 400)
    }

    if (employee.auth_user_id) {
      return apiError('Anställd har redan accepterat sin inbjudan', 400)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/app'
    const redirectTo = `${appUrl}/auth/callback`

    const { error: inviteError } = await auth.admin.auth.admin.inviteUserByEmail(employee.email, {
      redirectTo,
    })

    if (inviteError) {
      console.error('Failed to resend invite:', inviteError.message)
      return apiError('Kunde inte skicka inbjudan: ' + inviteError.message, 500)
    }

    return apiSuccess({ message: 'Inbjudan skickad' })
  } catch (err) {
    return handleRouteError(err)
  }
}
