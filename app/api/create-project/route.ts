// app/api/create-project/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
 const body = await req.json()
 const { 
  name, 
  tenant_id, 
  client_id, 
  customer_name, 
  base_rate_sek, 
  budgeted_hours,
  // New fields
  price_model,
  markup_percent,
  site_address,
  description,
  start_date,
  end_date,
  // ROT fields
  is_rot_rut,
  property_designation,
  apartment_number,
  brf_org_number,
 } = body || {}

 const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

 if (!supabaseUrl || !serviceKey) {
  return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL on server' }, { status: 500 })
 }

 const supabase = createClient(supabaseUrl, serviceKey)

 if (!tenant_id) return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 })
 if (!client_id) return NextResponse.json({ error: 'Missing client_id - ett projekt måste ha en kund' }, { status: 400 })

 // Validate ROT requirements
 if (is_rot_rut && !property_designation) {
  return NextResponse.json({ error: 'Fastighetsbeteckning krävs för ROT-avdrag' }, { status: 400 })
 }

 const payload: Record<string, unknown> = {
  name,
  tenant_id,
  client_id,
  status: 'active',
 }

 // Add optional fields
 if (customer_name) payload.customer_name = customer_name
 if (typeof base_rate_sek === 'number') payload.base_rate_sek = base_rate_sek
 if (typeof budgeted_hours === 'number') payload.budgeted_hours = budgeted_hours

 // New fields
 if (price_model) payload.price_model = price_model
 if (typeof markup_percent === 'number') payload.markup_percent = markup_percent
 if (site_address) payload.site_address = site_address
 if (description) payload.description = description
 if (start_date) payload.start_date = start_date
 if (end_date) payload.end_date = end_date

 // ROT/RUT fields
 if (typeof is_rot_rut === 'boolean') payload.is_rot_rut = is_rot_rut
 if (property_designation) payload.property_designation = property_designation
 if (apartment_number) payload.apartment_number = apartment_number
 if (brf_org_number) payload.brf_org_number = brf_org_number

 const { data, error } = await supabase.from('projects').insert([payload]).select('id, name').single()

 if (error) {
  console.error('Error creating project:', error)
  return NextResponse.json({ error: error.message || error }, { status: 400 })
 }

 return NextResponse.json({ id: data.id, name: data.name, data })
}
