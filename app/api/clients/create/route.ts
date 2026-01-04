import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route för att skapa client
 * Använder service role för att kringgå RLS
 */
export async function POST(req: Request) {
 try {
  const { tenantId, name, email, phone, address, orgNumber, clientType } = await req.json()

  if (!tenantId || !name) {
   return NextResponse.json(
    { error: 'tenantId and name are required' },
    { status: 400 }
   )
  }

  // Använd service role för att kringgå RLS
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL' },
    { status: 500 }
   )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Verify tenant exists before creating client
  const { data: tenantCheck, error: tenantCheckError } = await supabase
   .from('tenants')
   .select('id')
   .eq('id', tenantId)
   .maybeSingle()

  if (tenantCheckError || !tenantCheck) {
   return NextResponse.json(
    { error: `Tenant with ID ${tenantId} does not exist. Please ensure you have completed onboarding.` },
    { status: 400 }
   )
  }

  // Build client payload
  const clientPayload: any = {
   tenant_id: tenantId,
   name,
   email: email || null,
   phone: phone || null,
   address: address || null,
  }

  // Only include org_number if it's a company and the field has a value
  if (clientType === 'company' && orgNumber && orgNumber.trim()) {
   clientPayload.org_number = orgNumber.trim()
  }

  // Try to insert with org_number first (if applicable)
  let result = await supabase
   .from('clients')
   .insert([clientPayload])
   .select('id')
   .single()

  // If org_number column doesn't exist, retry without it
  if (result.error && (result.error.code === '42703' || result.error.message?.includes('org_number'))) {
   const { org_number, ...payloadWithoutOrg } = clientPayload
   result = await supabase
    .from('clients')
    .insert([payloadWithoutOrg])
    .select('id')
    .single()
  }

  if (result.error) {
   return NextResponse.json(
    { error: result.error.message },
    { status: 400 }
   )
  }

  return NextResponse.json({
   clientId: result.data.id,
  })
 } catch (err: any) {
  console.error('Error in create-client API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

