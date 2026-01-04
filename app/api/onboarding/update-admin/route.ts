import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route för att uppdatera admin employee record under onboarding
 * Använder service role för att kringgå RLS
 */
export async function POST(req: Request) {
 try {
  const { tenantId, userId, fullName, email, baseRate } = await req.json()

  if (!tenantId || !userId) {
   return NextResponse.json(
    { error: 'tenantId and userId are required' },
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

  // CRITICAL: Verify tenant exists first (like we do for projects)
  const { data: tenantCheck, error: tenantCheckError } = await supabase
   .from('tenants')
   .select('id')
   .eq('id', tenantId)
   .single()

  if (tenantCheckError || !tenantCheck) {
   console.error('Tenant verification failed:', tenantCheckError)
   return NextResponse.json(
    { 
     error: `Tenant ${tenantId} does not exist. Please complete step 1 of onboarding first.`,
     tenantId: tenantId,
     tenantError: tenantCheckError?.message,
    },
    { status: 400 }
   )
  }

  console.log('Tenant verified successfully:', tenantCheck.id)

  // CRITICAL: Extract verified tenant ID and use it everywhere
  const verifiedTenantId = tenantCheck.id

  // CRITICAL: Perform a "touch" update on the tenant to ensure it's visible in the current transaction
  // This forces PostgreSQL to recognize the tenant row exists before we create/update employee
  const { data: tenantName } = await supabase
   .from('tenants')
   .select('name')
   .eq('id', verifiedTenantId)
   .single()

  if (tenantName?.name) {
   const touchTenant = await supabase
    .from('tenants')
    .update({ name: tenantName.name }) // No-op update to same value
    .eq('id', verifiedTenantId)
    .select('id')
    .single()
   
   if (touchTenant.error || !touchTenant.data) {
    console.error('CRITICAL: Failed to touch tenant before employee creation:', touchTenant.error)
    return NextResponse.json(
     { 
      error: `Failed to verify tenant ${verifiedTenantId} exists in current transaction. Please try again.`,
      tenantCheckError: touchTenant.error?.message,
     },
     { status: 400 }
    )
   }
   
   console.log('Tenant touched successfully, tenant is now visible in transaction:', touchTenant.data)
  }

  // Hitta employee-record för denna användare och tenant (use verified tenant ID)
  const { data: existingEmployee, error: findError } = await supabase
   .from('employees')
   .select('id')
   .eq('auth_user_id', userId)
   .eq('tenant_id', verifiedTenantId)
   .maybeSingle()

  if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
   return NextResponse.json(
    { error: `Error finding employee: ${findError.message}` },
    { status: 400 }
   )
  }

  // Build update payload
  // Note: We don't include default_rate_sek by default since it might not exist
  // We'll only add it if the first attempt fails and tells us it exists
  const updatePayload: any = {
   role: 'admin',
  }

  if (fullName && fullName.trim()) {
   updatePayload.name = fullName.trim()
   updatePayload.full_name = fullName.trim()
  }

  if (email && email.trim()) {
   updatePayload.email = email.trim()
  }

  if (baseRate && !isNaN(Number(baseRate))) {
   updatePayload.base_rate_sek = Number(baseRate)
   // Don't include default_rate_sek initially - add it only if needed
  }

  let result
  let attemptedPayload = updatePayload // Default to updatePayload

  if (existingEmployee) {
   // Uppdatera befintlig employee med progressiv fallback
   let updateResult = await supabase
    .from('employees')
    .update(updatePayload)
    .eq('id', existingEmployee.id)
    .select('id')
    .single()

   // Fallback om full_name saknas
   if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('full_name'))) {
    const { full_name, ...payloadWithoutFullName } = updatePayload
    updateResult = await supabase
     .from('employees')
     .update(payloadWithoutFullName)
     .eq('id', existingEmployee.id)
     .select('id')
     .single()
   }

   // Fallback om base_rate_sek saknas
   if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('base_rate_sek'))) {
    const { base_rate_sek, ...payloadWithoutRates } = updatePayload
    updateResult = await supabase
     .from('employees')
     .update(payloadWithoutRates)
     .eq('id', existingEmployee.id)
     .select('id')
     .single()
   }

   // Fallback om email saknas
   if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('email'))) {
    const { email: emailField, ...payloadWithoutEmail } = updatePayload
    updateResult = await supabase
     .from('employees')
     .update(payloadWithoutEmail)
     .eq('id', existingEmployee.id)
     .select('id')
     .single()
   }

   result = updateResult
  } else {
   // Skapa ny employee om den inte finns
   const insertPayload: any = {
    auth_user_id: userId,
    tenant_id: verifiedTenantId, // Use verified tenant ID directly
    role: 'admin',
    ...updatePayload,
   }
   
   attemptedPayload = insertPayload // Store for error handling

   // Progressive fallback för att hantera saknade kolumner
   
   let insertResult = await supabase
    .from('employees')
    .insert([insertPayload])
    .select('id')
    .single()

   // Fallback om full_name saknas
   if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('full_name'))) {
    const { full_name, ...payloadWithoutFullName } = insertPayload
    payloadWithoutFullName.tenant_id = verifiedTenantId
    insertResult = await supabase
     .from('employees')
     .insert([payloadWithoutFullName])
     .select('id')
     .single()
   }

   // Fallback om base_rate_sek saknas
   if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('base_rate_sek'))) {
    const { base_rate_sek, ...payloadWithoutRates } = insertPayload
    payloadWithoutRates.tenant_id = verifiedTenantId
    insertResult = await supabase
     .from('employees')
     .insert([payloadWithoutRates])
     .select('id')
     .single()
   }

   // Fallback om email saknas
   if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('email'))) {
    const { email: emailField, ...payloadWithoutEmail } = insertPayload
    payloadWithoutEmail.tenant_id = verifiedTenantId
    delete payloadWithoutEmail.full_name
    delete payloadWithoutEmail.base_rate_sek
    insertResult = await supabase
     .from('employees')
     .insert([payloadWithoutEmail])
     .select('id')
     .single()
   }

   result = insertResult
  }

  // Handle foreign key constraint errors specifically
  if (result.error && (result.error.code === '23503' || result.error.message?.includes('foreign key') || result.error.message?.includes('employees_tenant_id_fkey'))) {
   // Re-check tenant exists
   const recheckTenant = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', verifiedTenantId)
    .single()
   
   console.error('Foreign key constraint violation. Tenant recheck:', recheckTenant)
   console.error('Attempted payload tenant_id:', verifiedTenantId)
   
   if (recheckTenant.data) {
    return NextResponse.json(
     { 
      error: `Foreign key constraint violation: Tenant exists in database but constraint check failed. This may indicate a database schema issue.`,
      tenantId: verifiedTenantId,
      tenantCheck: recheckTenant.data,
      attemptedPayload: attemptedPayload,
      diagnostic: {
       tenantExists: true,
       tenantIdType: typeof verifiedTenantId,
       tenantIdValue: verifiedTenantId,
       errorCode: result.error?.code,
       errorMessage: result.error?.message,
       fixInstructions: 'Please run the SUPABASE_DIAGNOSE_FIX_EMPLOYEES_FK.sql script in Supabase SQL Editor to diagnose and fix the foreign key constraint issue.',
      },
     },
     { status: 500 }
    )
   } else {
    return NextResponse.json(
     { 
      error: `Foreign key constraint violation: Tenant ${verifiedTenantId} does not exist in database after verification.`,
      tenantId: verifiedTenantId,
      tenantCheck: recheckTenant.data || null,
      tenantError: recheckTenant.error?.message || null,
     },
     { status: 400 }
    )
   }
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
   employeeId: result.data?.id,
   updated: !!existingEmployee,
  })
 } catch (err: any) {
  console.error('Error in update-admin API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

