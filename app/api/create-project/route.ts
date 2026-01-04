// app/api/create-project/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
 const body = await req.json()
 const { name, tenant_id, client_id, customer_name, base_rate_sek, budgeted_hours } = body || {}

 const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

 if (!supabaseUrl || !serviceKey) {
  return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL on server' }, { status: 500 })
 }

 const supabase = createClient(supabaseUrl, serviceKey)

 if (!tenant_id) return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 })
 if (!client_id) return NextResponse.json({ error: 'Missing client_id - ett projekt måste ha en kund' }, { status: 400 })

 const payload: any = {
  name,
  tenant_id,
  client_id,
 }

 // Add customer_name for backward compatibility
 if (customer_name) payload.customer_name = customer_name
 if (typeof base_rate_sek === 'number') payload.base_rate_sek = base_rate_sek
 if (typeof budgeted_hours === 'number') payload.budgeted_hours = budgeted_hours

 const { data, error } = await supabase.from('projects').insert([payload]).select('id, name').single()

 if (error) {
  return NextResponse.json({ error }, { status: 400 })
 }

 return NextResponse.json({ id: data.id, name: data.name, data })
}
