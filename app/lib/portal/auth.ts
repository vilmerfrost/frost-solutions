import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/utils/supabase/admin'
import { apiError } from '@/lib/api/response'

let cachedPortalJwtSecret: Uint8Array | null = null

function getPortalJwtSecret(): Uint8Array {
  const rawSecret = process.env.PORTAL_JWT_SECRET

  if (rawSecret) {
    if (!cachedPortalJwtSecret) {
      cachedPortalJwtSecret = new TextEncoder().encode(rawSecret)
    }
    return cachedPortalJwtSecret
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('PORTAL_JWT_SECRET must be configured in production')
  }

  if (!cachedPortalJwtSecret) {
    cachedPortalJwtSecret = new TextEncoder().encode('portal-secret-change-in-production')
  }

  return cachedPortalJwtSecret
}

export type PortalUserType = 'customer' | 'subcontractor'

export interface PortalUser {
  id: string
  tenantId: string
  clientId: string
  email: string
  name: string
  portalUserType: PortalUserType
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createPortalToken(user: PortalUser): Promise<string> {
  const jwtSecret = getPortalJwtSecret()

  return new SignJWT({
    sub: user.id,
    tenant_id: user.tenantId,
    client_id: user.clientId,
    email: user.email,
    name: user.name,
    portal_user_type: user.portalUserType ?? 'customer',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(jwtSecret)
}

export async function verifyPortalToken(token: string): Promise<PortalUser | null> {
  const jwtSecret = getPortalJwtSecret()

  try {
    const { payload } = await jwtVerify(token, jwtSecret)
    return {
      id: payload.sub as string,
      tenantId: payload.tenant_id as string,
      clientId: payload.client_id as string,
      email: payload.email as string,
      name: payload.name as string,
      portalUserType: (payload.portal_user_type as PortalUserType) ?? 'customer',
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
