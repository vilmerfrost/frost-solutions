// app/api/create-tenant/route.ts
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { apiError } from '@/lib/api/response'

export async function POST(req: Request) {
 // Auth check — user must be logged in (no tenant required yet)
 const supabaseAuth = await createServerClient()
 const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
 if (authError || !user) return apiError('Unauthorized', 401)

 const { company_name } = await req.json()
 const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

 const { data, error } = await supabase.from('tenants').insert({
  user_id: user.id,
  name: company_name,
  onboarded: false
 })
 return NextResponse.json({ data, error })
}
