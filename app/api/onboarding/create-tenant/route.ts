import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route för att skapa tenant under onboarding
 * Använder service role för att kringgå RLS
 */
export async function POST(req: Request) {
 try {
  const { name, orgNumber, userId } = await req.json()

  if (!name || !userId) {
   return NextResponse.json(
    { error: 'Name and userId are required' },
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

  // Skapa tenant - försök med org_number först, fallback utan
  const tenantPayload: any = { name }
  if (orgNumber && orgNumber.trim()) {
   tenantPayload.org_number = orgNumber.trim()
  }

  let newTenant
  let result = await supabase
   .from('tenants')
   .insert([tenantPayload])
   .select()
   .single()

  if (result.error && (result.error.code === '42703' || result.error.message?.includes('org_number'))) {
   // org_number column doesn't exist, try without it
   const fallback = await supabase
    .from('tenants')
    .insert([{ name }])
    .select()
    .single()
   if (fallback.error) {
    return NextResponse.json(
     { error: fallback.error.message },
     { status: 400 }
    )
   }
   newTenant = fallback.data
  } else if (result.error) {
   return NextResponse.json(
    { error: result.error.message },
    { status: 400 }
   )
  } else {
   newTenant = result.data
  }

  if (!newTenant || !newTenant.id) {
   console.error('Failed to create tenant - no data or id returned')
   return NextResponse.json(
    { error: 'Failed to create tenant - no data or id returned' },
    { status: 500 }
   )
  }

  const tenantId = newTenant.id
  
  console.log('Tenant created successfully:', { 
   tenantId, 
   tenantIdType: typeof tenantId,
   name: newTenant.name 
  })
  
  // CRITICAL: Verify tenant was actually created and can be queried back
  // This ensures the transaction is committed before we return
  const verifyTenant = await supabase
   .from('tenants')
   .select('id, name')
   .eq('id', tenantId)
   .single()
  
  if (verifyTenant.error || !verifyTenant.data) {
   console.error('CRITICAL: Tenant was created but cannot be verified!', verifyTenant.error)
   return NextResponse.json(
    { 
     error: `Tenant was created but verification failed: ${verifyTenant.error?.message || 'Unknown error'}`,
     tenantId: tenantId, // Still return it so frontend can try
    },
    { status: 500 }
   )
  }
  
  console.log('Tenant verification successful:', verifyTenant.data)

  // Skapa employee record för användaren
  const employeeName = userId.includes('@') ? userId.split('@')[0] : 'Admin'
  
  // Försök med full payload, fallback progressivt
  const empPayload: any = {
   auth_user_id: userId,
   tenant_id: tenantId, // Use verified tenantId variable
   name: employeeName,
   full_name: employeeName,
   role: 'admin',
   base_rate_sek: 360,
   default_rate_sek: 360,
  }

  let empResult = await supabase
   .from('employees')
   .insert([empPayload])
   .select('id')
   .single()

  // Fallback om base_rate_sek saknas
  if (empResult.error && (empResult.error.code === '42703' || empResult.error.message?.includes('base_rate_sek'))) {
   const { base_rate_sek, default_rate_sek, ...payloadWithoutRates } = empPayload
   empResult = await supabase
    .from('employees')
    .insert([payloadWithoutRates])
    .select('id')
    .single()
  }

  // Fallback om full_name saknas
  if (empResult.error && (empResult.error.code === '42703' || empResult.error.message?.includes('full_name'))) {
   const { full_name, ...payloadMinimal } = empPayload
   delete payloadMinimal.base_rate_sek
   delete payloadMinimal.default_rate_sek
   empResult = await supabase
    .from('employees')
    .insert([payloadMinimal])
    .select('id')
    .single()
  }

  // Ytterligare fallback - försök med bara minimala fält
  if (empResult.error && (empResult.error.code === '42703' || empResult.error.code === '23505')) {
   // 23505 = unique violation - employee finns redan, hämta den istället
   const existing = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', userId)
    .eq('tenant_id', tenantId) // Use verified tenantId variable
    .maybeSingle()
   
   if (existing.data) {
    empResult = { data: existing.data, error: null }
   } else {
    // Försök med absolut minimal payload
    const minimalPayload: any = {
     auth_user_id: userId,
     tenant_id: tenantId, // Use verified tenantId variable
     name: employeeName,
     role: 'admin',
    }
    empResult = await supabase
     .from('employees')
     .insert([minimalPayload])
     .select('id')
     .single()
   }
  }

  if (empResult.error) {
   console.error('Error creating employee during tenant creation:', empResult.error)
   console.error('Employee payload was:', empPayload)
   // Don't fail the request, but log it - return null for employeeId
  }

  return NextResponse.json({
   tenantId: tenantId, // Use verified tenantId variable
   employeeId: empResult.data?.id || null,
   employeeError: empResult.error ? empResult.error.message : null,
  })
 } catch (err: any) {
  console.error('Error in create-tenant API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

