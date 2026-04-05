import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/utils/supabase/admin'
import { apiError } from '@/lib/api/response'

const PORTAL_JWT_SECRET = new TextEncoder().encode(
  process.env.PORTAL_JWT_SECRET || 'portal-secret-change-in-production'
)

export interface PortalUser {
  id: string
  tenantId: string
  clientId: string
  email: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createPortalToken(user: PortalUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    tenant_id: user.tenantId,
    client_id: user.clientId,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(PORTAL_JWT_SECRET)
}

export async function verifyPortalToken(token: string): Promise<PortalUser | null> {
  try {
    const { payload } = await jwtVerify(token, PORTAL_JWT_SECRET)
    return {
      id: payload.sub as string,
      tenantId: payload.tenant_id as string,
      clientId: payload.client_id as string,
      email: payload.email as string,
      name: payload.name as string,
    }
  } catch {
    return null
  }
}

type PortalAuthResult =
  | { user: PortalUser; admin: ReturnType<typeof createAdminClient>; error: null }
  | { user: null; error: ReturnType<typeof apiError> }

/**
 * Resolves portal authentication from Authorization header.
 * Separate from Supabase auth — used for customer portal users.
 */
export async function resolvePortalAuth(req: Request): Promise<PortalAuthResult> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: apiError('Missing portal authentication', 401) }
  }

  const token = authHeader.slice(7)
  const user = await verifyPortalToken(token)

  if (!user) {
    return { user: null, error: apiError('Invalid or expired portal token', 401) }
  }

  // Verify user still exists and is active
  const admin = createAdminClient()
  const { data: portalUser } = await admin
    .from('customer_portal_users')
    .select('id, active')
    .eq('id', user.id)
    .single()

  if (!portalUser || !portalUser.active) {
    return { user: null, error: apiError('Account deactivated', 403) }
  }

  return { user, admin, error: null }
}
