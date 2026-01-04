import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
 try {
  const body = await req.json()
  const tenantId = body?.tenant_id ?? body?.tenantId
  let userId = body?.user_id ?? body?.userId

  if (!tenantId) {
   return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
  }

  // If userId not provided, try to get it from the current session
  if (!userId) {
   try {
    const { createClient: createServerClient } = await import('@/utils/supabase/server')
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
   } catch {
    // Ignore errors
   }
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
