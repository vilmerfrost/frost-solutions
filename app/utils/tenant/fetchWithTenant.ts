/**
 * @deprecated Use useTenant() hook and pass tenant directly in API calls.
 * This function is kept for backwards compatibility but should not be used in new code.
 * 
 * Security: Server-side should always validate tenant via JWT claim, not from headers.
 */
export async function fetchWithTenant(input: RequestInfo | URL, init?: RequestInit) {
 if (typeof window === 'undefined') {
  throw new Error('fetchWithTenant must be called from client code')
 }

 // Try to get tenant from multiple sources (migration-friendly)
 let tenant: string | null = null
 
 try {
  // Try localStorage (legacy)
  tenant = localStorage.getItem('tenant_id') || localStorage.getItem('tenantId')
 } catch {}

 if (!tenant) {
  throw new Error('No tenant_id found. Use useTenant() hook to get tenant.')
 }

 // Prepare headers
 const headers = new Headers(init?.headers ?? {})
 // Attach tenant as a header (server should validate via JWT, not trust this)
 headers.set('x-tenant-id', tenant)

 // If body is JSON string and doesn't include tenant_id, inject it for convenience
 let body = init?.body
 const contentType = headers.get('content-type') || ''
 if (contentType.includes('application/json') && typeof body === 'string') {
  try {
   const parsed = JSON.parse(body)
   if (!parsed?.tenant_id) parsed.tenant_id = tenant
   body = JSON.stringify(parsed)
  } catch (e) {
   // leave body as-is on parse errors
  }
 }

 return fetch(input, { ...init, headers, body })
}

export default fetchWithTenant
