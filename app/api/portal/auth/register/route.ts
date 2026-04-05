import { NextRequest } from 'next/server'
import { z } from 'zod'
import { parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createAdminClient } from '@/utils/supabase/admin'
import { hashPassword, createPortalToken } from '@/lib/portal/auth'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  tenant_id: z.string().uuid(),
  client_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, RegisterSchema)
    if (parsed.error) return parsed.error

    const { email, password, name, tenant_id, client_id } = parsed.data
    const admin = createAdminClient()

    // Verify client exists in the tenant
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (!client) {
      return apiError('Invalid client or tenant', 400)
    }

    // Check if user already exists
    const { data: existing } = await admin
      .from('customer_portal_users')
      .select('id')
      .eq('email', email)
      .eq('tenant_id', tenant_id)
      .single()

    if (existing) {
      return apiError('An account with this email already exists', 409)
    }

    const passwordHash = await hashPassword(password)

    const { data: user, error: insertError } = await admin
      .from('customer_portal_users')
      .insert({
        tenant_id,
        client_id,
        email,
        name,
        password_hash: passwordHash,
      })
      .select()
      .single()

    if (insertError || !user) {
      return apiError('Failed to create account', 500)
    }

    const token = await createPortalToken({
      id: user.id,
      tenantId: tenant_id,
      clientId: client_id,
      email,
      name,
    })

    return apiSuccess({ token, user: { id: user.id, email, name } }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
