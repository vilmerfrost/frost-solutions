import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createAdminClient } from '@/utils/supabase/admin'
import { verifyPassword, createPortalToken } from '@/lib/portal/auth'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenant_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, LoginSchema)
    if (parsed.error) return parsed.error

    const { email, password, tenant_id } = parsed.data
    const admin = createAdminClient()

    const { data: user } = await admin
      .from('customer_portal_users')
      .select('*')
      .eq('email', email)
      .eq('tenant_id', tenant_id)
      .eq('active', true)
      .single()

    if (!user || !user.password_hash) {
      return apiError('Invalid email or password', 401)
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return apiError('Invalid email or password', 401)
    }

    // Update last login
    await admin
      .from('customer_portal_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    const token = await createPortalToken({
      id: user.id,
      tenantId: user.tenant_id,
      clientId: user.client_id,
      email: user.email,
      name: user.name,
      portalUserType: user.portal_user_type ?? 'customer',
    })

    return apiSuccess({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    return handleRouteError(error)
  }
}
