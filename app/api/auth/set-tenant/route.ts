import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, isValidUUID } from '@/lib/security'

/**
 * SECURITY:
 * - Requires authentication
 * - Rate limited to prevent abuse
 * - Only allows setting tenant for the authenticated user
 * - Validates tenant_id format
 */
export async function POST(req: Request) {
 try {
  // SECURITY: Rate limiting - max 20 set-tenant requests per IP per hour
  const clientIP = getClientIP(req)
  const rateLimitResult = checkRateLimit(`set-tenant:${clientIP}`, 20, 60 * 60 * 1000)
  if (!rateLimitResult.allowed) {
   return NextResponse.json(
    { error: 'För många förfrågningar. Försök igen senare.' },
    { 
     status: 429,
     headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
    }
   )
  }

  const body = await req.json()
  const tenantId = body?.tenant_id ?? body?.tenantId
  let userId = body?.user_id ?? body?.userId

  if (!tenantId) {
   return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
  }

  // SECURITY: Validate tenant_id format
  if (!isValidUUID(tenantId)) {
   return NextResponse.json({ error: 'Invalid tenant_id format' }, { status: 400 })
  }

  // SECURITY: ALWAYS get userId from the current session (authenticated user)
  // Never trust userId from the request body for security-critical operations
  const { createClient: createServerClient } = await import('@/utils/supabase/server')
  const supabase = createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // SECURITY: Always use the authenticated user's ID, ignore any userId from request
  userId = user.id
  
  // SECURITY: If request body contained a different userId, log a warning
  const requestedUserId = body?.user_id ?? body?.userId
  if (requestedUserId && requestedUserId !== userId) {
   console.warn('SECURITY: Attempt to set tenant for different user blocked', {
    authenticatedUser: userId,
    requestedUserId: requestedUserId,
    ip: clientIP
   })
   // Continue with the authenticated user's ID, don't return error
  }

  let updatedUser: any = null

  // If userId is available, try to update the user's app_metadata via service role
  if (userId) {
   const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
   const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
   if (supabaseUrl && serviceKey) {
    try {
     const admin = createClient(supabaseUrl, serviceKey)
     const { data, error } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { tenant_id: tenantId },
     })
     if (error) {
      console.error('set-tenant: failed to update user metadata', error)
      // Continue anyway - we'll still set the cookie
     } else {
      updatedUser = data?.user ?? null
     }
    } catch (err) {
     console.error('set-tenant: error updating user metadata', err)
     // Continue anyway - we'll still set the cookie
    }
   }
  }

  // Build response and set httpOnly cookie so server-side reads tenant
  const res = NextResponse.json({ 
   ok: true, 
   user: updatedUser,
   tenantId: String(tenantId),
   metadataUpdated: !!updatedUser
  })
  
  // Set cookie - this is critical for immediate use in server components
  res.cookies.set('tenant_id', String(tenantId), {
   httpOnly: true,
   sameSite: 'lax',
   path: '/',
   secure: process.env.NODE_ENV === 'production',
   maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return res
 } catch (err: any) {
  console.error('set-tenant error', err)
  return NextResponse.json({ error: String(err) }, { status: 500 })
 }
}
