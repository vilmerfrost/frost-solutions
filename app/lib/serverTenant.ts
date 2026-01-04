import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Unified tenant resolution for server-side code.
 * Priority: JWT claim (app_metadata.tenant_id) > httpOnly cookie
 * 
 * Security: Always validates via JWT. Cookie is convenience only.
 * Returns null if no tenant found or user not authenticated.
 * 
 * @returns Promise<string | null> - Tenant ID from JWT claim or cookie
 */
export async function getTenantId(): Promise<string | null> {
 try {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
   return null
  }

  // Priority 1: JWT claim (authoritative)
  const claimTenant = (user.app_metadata as Record<string, unknown>)?.tenant_id
  if (claimTenant && typeof claimTenant === 'string') {
   return claimTenant
  }

  // Priority 2: httpOnly cookie (convenience, set by /api/auth/set-tenant)
  const c = await cookies()
  const cookieTenant = c.get('tenant_id')?.value
  if (cookieTenant) {
   return cookieTenant
  }

  // Priority 3: fall back to user_roles via service-role client
  try {
   const admin = createAdminClient()
   const { data: roleData } = await admin
    .from('user_roles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

   if (roleData?.tenant_id) {
    return roleData.tenant_id
   }
  } catch (roleError) {
   console.error('getTenantId: failed to resolve tenant via user_roles', roleError)
  }

  return null
 } catch (err) {
  // cookies() may throw in some contexts (e.g., middleware, edge runtime)
  return null
 }
}

/**
 * Get tenant from request (for API routes that need fallback to body/headers).
 * Still prioritizes JWT claim, but allows body/header as convenience.
 * 
 * WARNING: When validating writes, always use JWT claim from getTenantId(), not body/headers.
 * This function is for reading convenience only.
 * 
 * @param req - Optional Request object (for reading headers)
 * @param body - Optional request body (for reading tenant_id/tenantId)
 * @returns Promise<string | null> - Tenant ID with fallback to body/headers
 */
export async function getTenantFromRequest(
 req?: Request,
 body?: Record<string, unknown>
): Promise<string | null> {
 // Priority 1: JWT claim (always authoritative)
 const claimTenant = await getTenantId()
 if (claimTenant) {
  return claimTenant
 }

 // Priority 2: httpOnly cookie
 try {
  const c = await cookies()
  const cookieTenant = c.get('tenant_id')?.value
  if (cookieTenant) return cookieTenant
 } catch {}

 // Priority 3: Body (convenience only, not for security)
 if (body) {
  const b = body.tenant_id ?? body.tenantId
  if (b && typeof b === 'string') return b
 }

 // Priority 4: Header (convenience only)
 if (req?.headers) {
  const headerTenant = req.headers.get('x-tenant-id') ?? req.headers.get('x-tenant')
  if (headerTenant) return headerTenant
 }

 return null
}

