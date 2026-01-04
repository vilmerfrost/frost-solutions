import { NextResponse } from 'next/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
 try {
  // Create server client which uses cookies to read session
  const serverSupabase = createServerClient()
  const { data: { user }, error: userErr } = await serverSupabase.auth.getUser()

  if (userErr) {
   console.warn('get-tenant: server supabase getUser error', userErr)
  }

  if (!user?.id) {
   return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
  }

  const authUserId = user.id

  // Try server client first (may be blocked by RLS). If that fails, use service role key.
  try {
   const { data, error } = await serverSupabase
    .from('employees')
    .select('tenant_id')
    .eq('auth_user_id', authUserId)
    .limit(1)
    .single()

   if (!error && data?.tenant_id) {
    return NextResponse.json({ tenantId: data.tenant_id })
   }
  } catch (err) {
   // ignore and fall back to service role
   console.warn('get-tenant: server query failed, falling back to service role', err)
  }

  // Fallback: use service role key to query employees directly
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL' }, { status: 500 })
  }

  const service = createAnonClient(supabaseUrl, serviceKey)
  const { data: svcData, error: svcErr } = await service
   .from('employees')
   .select('tenant_id')
   .eq('auth_user_id', authUserId)
   .limit(1)
   .single()

  if (svcErr) {
   console.error('get-tenant service query error', svcErr)
   return NextResponse.json({ error: svcErr.message ?? svcErr }, { status: 500 })
  }

  if (!svcData?.tenant_id) {
   return NextResponse.json({ error: 'No tenant found for user' }, { status: 404 })
  }

  return NextResponse.json({ tenantId: svcData.tenant_id })
 } catch (err: any) {
  console.error('get-tenant error', err)
  return NextResponse.json({ error: String(err) }, { status: 500 })
 }
}
