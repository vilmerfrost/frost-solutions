// app/api/auth/csrf/route.ts
// API route to get a CSRF token for client-side forms

import { handleCsrfTokenRequest } from '@/lib/security/csrf'

export const runtime = 'nodejs'

/**
 * GET /api/auth/csrf
 * Returns a CSRF token and sets it in a httpOnly cookie
 * Client should call this before making POST/PUT/DELETE requests
 * and include the token in the x-csrf-token header
 */
export async function GET() {
  return handleCsrfTokenRequest()
}
