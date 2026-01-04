// app/api/create-tenant/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
 const { user_id, company_name } = await req.json()
 const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
 
 const { data, error } = await supabase.from('tenants').insert({
  user_id,
  name: company_name,
  onboarded: false
 })
 return NextResponse.json({ data, error })
}
