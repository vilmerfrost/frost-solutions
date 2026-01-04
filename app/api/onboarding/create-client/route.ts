import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route för att skapa client under onboarding
 * Använder service role för att kringgå RLS
 */
export async function POST(req: Request) {
 try {
  const { tenantId, name, email, address, orgNumber, clientType } = await req.json()

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
  console.log('Verifying tenant exists with ID:', tenantId, 'Type:', typeof tenantId)
  
  const { data: tenantCheck, error: tenantCheckError } = await supabase
   .from('tenants')
   .select('id, name')
   .eq('id', tenantId)
   .maybeSingle()

  console.log('Tenant check result:', { tenantCheck, tenantCheckError })

  if (tenantCheckError) {
   console.error('Error checking tenant:', tenantCheckError)
   return NextResponse.json(
    { error: `Error verifying tenant: ${tenantCheckError.message}` },
    { status: 400 }
   )
  }

  if (!tenantCheck || !tenantCheck.id) {
   // List all tenants for debugging
   const { data: allTenants } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(10)
   
   console.error('Tenant not found. Looking for:', tenantId)
   console.error('Available tenants:', allTenants)
   
   return NextResponse.json(
    { error: `Tenant with ID ${tenantId} does not exist. Please complete step 1 of onboarding first. Available tenants: ${JSON.stringify(allTenants?.map(t => t.id))}` },
    { status: 400 }
   )
  }

  // Build client payload
  const clientPayload: any = {
   tenant_id: tenantId,
   name,
   email: email || null,
   address: address || null,
  }

  // Only include org_number if it's a company and the field has a value
  if (clientType === 'company' && orgNumber && orgNumber.trim()) {
   clientPayload.org_number = orgNumber.trim()
  }

  console.log('Attempting to create client with payload:', clientPayload)

  // Try to insert with org_number first (if applicable)
  let result = await supabase
   .from('clients')
   .insert([clientPayload])
   .select('id')
   .single()

  console.log('Client insert result:', { 
   error: result.error, 
   data: result.data,
   errorCode: result.error?.code,
   errorMessage: result.error?.message
  })

  // If org_number column doesn't exist, retry without it
  if (result.error && (result.error.code === '42703' || result.error.message?.includes('org_number'))) {
   const { org_number, ...payloadWithoutOrg } = clientPayload
   console.log('Retrying without org_number:', payloadWithoutOrg)
   result = await supabase
    .from('clients')
    .insert([payloadWithoutOrg])
    .select('id')
    .single()
   console.log('Client insert retry result:', { error: result.error, data: result.data })
  }

  // If foreign key constraint error, it means tenant doesn't exist
  if (result.error && (result.error.code === '23503' || result.error.message?.includes('foreign key') || result.error.message?.includes('clients_tenant_id_fkey'))) {
   // Double-check tenant exists
   const recheckTenant = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', tenantId)
    .single()
   
   console.error('Foreign key constraint violation. Tenant recheck:', recheckTenant)
   
   return NextResponse.json(
    { 
     error: `Foreign key constraint violation: Tenant ${tenantId} does not exist in database. This may be a transaction timing issue. Please try again.`,
     tenantId: tenantId,
     tenantCheck: recheckTenant.data || null,
     tenantError: recheckTenant.error?.message || null,
    },
    { status: 400 }
   )
  }

  if (result.error) {
   return NextResponse.json(
    { 
     error: result.error.message,
     errorCode: result.error.code,
     errorDetails: result.error.details,
     hint: result.error.hint,
    },
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

