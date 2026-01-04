import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route för att skapa project under onboarding
 * Använder service role för att kringgå RLS
 */
export async function POST(req: Request) {
 try {
  const { tenantId, name, clientId, baseRate, budgetedHours } = await req.json()

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

  console.log('Creating project - verifying tenant exists with ID:', tenantId, 'Type:', typeof tenantId)

  // First, let's see ALL tenants in the database to debug
  const { data: allTenants, error: allTenantsError } = await supabase
   .from('tenants')
   .select('id, name, created_at')
   .order('created_at', { ascending: false })
   .limit(20)
  
  console.log('ALL TENANTS IN DATABASE:', allTenants)
  console.log('Error fetching all tenants:', allTenantsError)

  // Verify tenant exists - try multiple times in case of timing issues
  let tenantCheck: any = null
  let tenantCheckError: any = null
  let retryCount = 0
  const maxRetries = 5 // Increased retries
  const baseDelay = 300 // Increased base delay
  
  while (retryCount < maxRetries && !tenantCheck) {
   console.log(`Attempt ${retryCount + 1} to find tenant ${tenantId}`)
   
   const result = await supabase
    .from('tenants')
    .select('id, name, created_at')
    .eq('id', tenantId)
    .maybeSingle()

   tenantCheck = result.data
   tenantCheckError = result.error

   if (tenantCheck) {
    console.log(`✅ Tenant found on attempt ${retryCount + 1}:`, tenantCheck)
    break
   } else {
    console.log(`❌ Tenant not found on attempt ${retryCount + 1}. Error:`, tenantCheckError)
    
    // Try to find tenant by searching all tenants (case-insensitive match)
    if (allTenants && !tenantCheck) {
     const foundTenant = allTenants.find(t => 
      t.id.toLowerCase() === tenantId.toLowerCase() ||
      String(t.id) === String(tenantId)
     )
     if (foundTenant) {
      console.log(`⚠️ Found tenant with case-insensitive match:`, foundTenant)
      tenantCheck = foundTenant
      break
     }
    }
   }

   if (retryCount < maxRetries - 1) {
    const delay = baseDelay * (retryCount + 1)
    console.log(`Waiting ${delay}ms before retry ${retryCount + 2}...`)
    await new Promise(resolve => setTimeout(resolve, delay))
   }
   retryCount++
  }

  console.log('Tenant check result (after retries):', { 
   tenantCheck, 
   tenantCheckError, 
   retries: retryCount,
   searchedId: tenantId,
   allTenantIds: allTenants?.map(t => t.id)
  })

  if (tenantCheckError && !tenantCheck) {
   console.error('Error checking tenant:', tenantCheckError)
   
   return NextResponse.json(
    { 
     error: `Error verifying tenant: ${tenantCheckError.message}`,
     searchedTenantId: tenantId,
     availableTenants: allTenants,
     availableTenantIds: allTenants?.map(t => t.id),
    },
    { status: 400 }
   )
  }

  if (!tenantCheck || !tenantCheck.id) {
   console.error('Tenant not found after all retries. Looking for:', tenantId)
   console.error('Available tenants:', allTenants)
   console.error('Available tenant IDs:', allTenants?.map(t => ({ id: t.id, name: t.name })))
   
   return NextResponse.json(
    { 
     error: `Tenant with ID ${tenantId} does not exist in database after ${maxRetries} retry attempts. Please complete step 1 of onboarding first.`,
     searchedTenantId: tenantId,
     availableTenants: allTenants,
     availableTenantIds: allTenants?.map(t => t.id),
     retryAttempts: retryCount,
    },
    { status: 400 }
   )
  }

  console.log('Tenant verified successfully:', tenantCheck)

  // CRITICAL: Extract verified tenant ID from database verification result
  // This ensures exact format match and avoids any string/trimming issues
  const verifiedTenantId = tenantCheck.id // Use the ID from the verified tenant record
  
  console.log('Extracted verified tenant ID:', verifiedTenantId, 'Type:', typeof verifiedTenantId)

  // CRITICAL: Perform a "touch" update on the tenant to ensure it's visible in the current transaction
  // This forces PostgreSQL to recognize the tenant row exists before we create the project
  const touchTenant = await supabase
   .from('tenants')
   .update({ name: tenantCheck.name }) // No-op update to same value
   .eq('id', verifiedTenantId)
   .select('id')
   .single()
  
  if (touchTenant.error || !touchTenant.data) {
   console.error('CRITICAL: Failed to touch tenant before project creation:', touchTenant.error)
   return NextResponse.json(
    { 
     error: `Failed to verify tenant ${verifiedTenantId} exists in current transaction. Please try again.`,
     tenantCheckError: touchTenant.error?.message,
    },
    { status: 400 }
   )
  }
  
  console.log('Tenant touched successfully, tenant is now visible in transaction:', touchTenant.data)

  // Verify client exists if clientId is provided
  if (clientId) {
   const { data: clientCheck, error: clientCheckError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .eq('tenant_id', verifiedTenantId) // Use verified tenant ID instead of input
    .maybeSingle()

   if (clientCheckError || !clientCheck) {
    return NextResponse.json(
     { error: `Client with ID ${clientId} does not exist or does not belong to tenant ${verifiedTenantId}. Please complete step 2 of onboarding first.` },
     { status: 400 }
    )
   }
  }

  // Build project payload
  
  const projectPayload: any = {
   tenant_id: verifiedTenantId, // Use verified tenant ID from database, not input
   name: String(name).trim(),
  }
  
  console.log('Built project payload:', JSON.stringify(projectPayload, null, 2))
  console.log('Using verified tenant ID from database:', verifiedTenantId, 'Type:', typeof verifiedTenantId)
  console.log('Original tenant ID from input:', tenantId, 'Type:', typeof tenantId)

  // Add optional fields if provided
  if (clientId) {
   projectPayload.client_id = clientId
  }
  if (baseRate && !isNaN(Number(baseRate))) {
   projectPayload.base_rate_sek = Number(baseRate)
  }
  if (budgetedHours && !isNaN(Number(budgetedHours))) {
   projectPayload.budgeted_hours = Number(budgetedHours)
  }

  // Try to add status field (if it exists)
  projectPayload.status = 'planned'

  console.log('Attempting to create project with payload:', JSON.stringify(projectPayload, null, 2))
  console.log('Tenant ID being used:', verifiedTenantId, 'Type:', typeof verifiedTenantId, 'Length:', verifiedTenantId?.length)
  
  // Ensure verifiedTenantId is a valid UUID format (it should be since it came from DB, but verify to be safe)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(String(verifiedTenantId))) {
   console.error('Invalid verified tenant ID format:', verifiedTenantId)
   return NextResponse.json(
    { error: `Invalid verified tenant ID format: ${verifiedTenantId}. Expected UUID format.` },
    { status: 400 }
   )
  }

  // Final verification - ensure tenant is still there right before insert
  // Use verifiedTenantId (from database) instead of input tenantId
  const finalTenantCheck = await supabase
   .from('tenants')
   .select('id')
   .eq('id', verifiedTenantId) // Use verified tenant ID
   .single()
  
  if (finalTenantCheck.error || !finalTenantCheck.data) {
   console.error('CRITICAL: Tenant disappeared before project creation!', finalTenantCheck.error)
   return NextResponse.json(
    { 
     error: `Tenant ${verifiedTenantId} could not be verified immediately before project creation. Please try again.`,
     tenantCheckError: finalTenantCheck.error?.message,
    },
    { status: 400 }
   )
  }

  console.log('Final tenant check passed, proceeding with project creation')
  console.log('Final verified tenant ID:', finalTenantCheck.data.id)

  // Try to insert with all fields
  let result = await supabase
   .from('projects')
   .insert([projectPayload])
   .select('id')
   .single()

  console.log('Project insert result:', { 
   error: result.error, 
   data: result.data,
   errorCode: result.error?.code,
   errorMessage: result.error?.message
  })

  // If status column doesn't exist, retry without it
  if (result.error && (result.error.code === '42703' || result.error.message?.includes('status'))) {
   const { status, ...payloadWithoutStatus } = projectPayload
   console.log('Retrying without status:', payloadWithoutStatus)
   result = await supabase
    .from('projects')
    .insert([payloadWithoutStatus])
    .select('id')
    .single()
   console.log('Project insert retry result:', { error: result.error, data: result.data })
  }

  // If base_rate_sek doesn't exist, retry without it
  if (result.error && (result.error.code === '42703' || result.error.message?.includes('base_rate_sek'))) {
   const { base_rate_sek, ...payloadWithoutRate } = projectPayload
   delete payloadWithoutRate.status // Remove status too if we already tried
   console.log('Retrying without base_rate_sek:', payloadWithoutRate)
   result = await supabase
    .from('projects')
    .insert([payloadWithoutRate])
    .select('id')
    .single()
  }

  // If budgeted_hours doesn't exist, retry without it
  if (result.error && (result.error.code === '42703' || result.error.message?.includes('budgeted_hours'))) {
   const { budgeted_hours, ...payloadWithoutBudget } = projectPayload
   delete payloadWithoutBudget.status
   delete payloadWithoutBudget.base_rate_sek
   console.log('Retrying without budgeted_hours:', payloadWithoutBudget)
   result = await supabase
    .from('projects')
    .insert([payloadWithoutBudget])
    .select('id')
    .single()
  }

  // If foreign key constraint error
  if (result.error && (result.error.code === '23503' || result.error.message?.includes('foreign key') || result.error.message?.includes('projects_tenant_id_fkey'))) {
   // Double-check tenant exists using verifiedTenantId
   const recheckTenant = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', verifiedTenantId) // Use verified tenant ID
    .single()
   
   console.error('Foreign key constraint violation. Tenant recheck:', recheckTenant)
   console.error('Attempted project payload:', projectPayload)
   console.error('Using verified tenant ID:', verifiedTenantId)
   console.error('Original input tenant ID:', tenantId)
   
   // Also check client if provided
   if (clientId) {
    const recheckClient = await supabase
     .from('clients')
     .select('id, name, tenant_id')
     .eq('id', clientId)
     .single()
    console.error('Client recheck:', recheckClient)
   }
   
   // If tenant exists but FK still fails, this is a database schema configuration issue
   if (recheckTenant.data) {
    // Log detailed diagnostic information
    console.error('FOREIGN KEY CONSTRAINT DIAGNOSTIC:')
    console.error('- Tenant exists:', recheckTenant.data)
    console.error('- Tenant ID type:', typeof verifiedTenantId)
    console.error('- Tenant ID value:', verifiedTenantId)
    console.error('- Project payload:', projectPayload)
    console.error('- Error details:', result.error)
    
    // Return detailed error with diagnostic information and fix instructions
    return NextResponse.json(
     { 
      error: `Foreign key constraint violation: Tenant exists in database but constraint check failed. This indicates a database schema configuration issue.`,
      tenantId: verifiedTenantId,
      tenantCheck: recheckTenant.data,
      attemptedPayload: projectPayload,
      diagnostic: {
       tenantExists: true,
       tenantIdType: typeof verifiedTenantId,
       tenantIdValue: verifiedTenantId,
       errorCode: result.error?.code,
       errorMessage: result.error?.message,
       fixInstructions: 'Please run the SUPABASE_DIAGNOSE_FIX_FK.sql script in Supabase SQL Editor. This script will diagnose and fix the foreign key constraint issue.',
      },
     },
     { status: 500 }
    )
   } else {
    return NextResponse.json(
     { 
      error: `Foreign key constraint violation: Tenant ${verifiedTenantId} does not exist in database after verification. This may be a transaction timing issue. Please try again.`,
      tenantId: verifiedTenantId,
      tenantCheck: recheckTenant.data || null,
      tenantError: recheckTenant.error?.message || null,
      attemptedPayload: projectPayload,
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
   projectId: result.data.id,
  })
 } catch (err: any) {
  console.error('Error in create-project API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

