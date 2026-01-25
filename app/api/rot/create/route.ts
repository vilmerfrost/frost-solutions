import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { encryptPnr } from '@/lib/crypto/pnr'

/**
 * API route för att skapa ROT-ansökningar med service role
 * Verifierar tenant_id innan skapande
 */
export async function POST(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const payload = await req.json()
  const { tenant_id, project_id, client_id, customer_person_number, property_designation, work_type, work_cost_sek, material_cost_sek, total_cost_sek } = payload

  if (!tenant_id) {
   return NextResponse.json(
    { error: 'tenant_id is required' },
    { status: 400 }
   )
  }

  // Use service role for tenant verification and RLS bypass
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Verify tenant exists
  const { data: tenantData, error: tenantError } = await adminSupabase
   .from('tenants')
   .select('id, name')
   .eq('id', tenant_id)
   .single()

  if (tenantError || !tenantData) {
   // SECURITY: Log details server-side only, don't expose to client
   console.error('❌ Tenant verification failed:', {
    tenant_id,
    error: tenantError,
    errorCode: tenantError?.code,
    errorMessage: tenantError?.message
   })
   
   // SECURITY: Generic error message - don't expose tenant existence or other tenant IDs
   return NextResponse.json(
    { error: 'Tenant validation failed. Please ensure you are properly authenticated and try again.' },
    { status: 400 }
   )
  }

  // CRITICAL: Use the tenant ID directly from the database query result
  // This ensures we use the exact UUID format and value from PostgreSQL
  const verifiedTenantId = tenantData.id
  
  console.log('Tenant verified:', { 
   requestedTenantId: tenant_id, 
   verifiedTenantId: verifiedTenantId,
   tenantName: tenantData.name,
   idsMatch: tenant_id === verifiedTenantId
  })

  // CRITICAL: "Touch" update to ensure tenant is visible in current transaction context
  // This is essential for foreign key constraint validation
  try {
   // Strategy 1: Try updating updated_at if it exists
   const touchResult = await adminSupabase
    .from('tenants')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', verifiedTenantId)
    .select('id')
   
   if (touchResult.error && touchResult.error.code !== '42703') {
    // Column doesn't exist error is ok, but other errors are not
    console.warn('Could not touch tenant with updated_at:', touchResult.error)
   }
   
   // Strategy 2: Also try updating name (no-op update to same value)
   if (tenantData.name) {
    await adminSupabase
     .from('tenants')
     .update({ name: tenantData.name })
     .eq('id', verifiedTenantId)
   }
   
   // Strategy 3: Always do a SELECT to ensure tenant is visible
   // This forces PostgreSQL to "see" the tenant in the transaction
   const verifySelect = await adminSupabase
    .from('tenants')
    .select('id')
    .eq('id', verifiedTenantId)
    .single()
   
   if (!verifySelect.data || verifySelect.error) {
    console.error('CRITICAL: Tenant not visible in transaction after touch:', {
     verifiedTenantId,
     error: verifySelect.error
    })
    return NextResponse.json(
     { 
      error: 'Tenant not visible in transaction. Please try again.',
      details: verifySelect.error?.message || 'Transaction isolation issue'
     },
     { status: 400 }
    )
   } else {
    console.log('✅ Tenant confirmed visible in transaction:', verifiedTenantId)
   }
  } catch (touchError: any) {
   console.warn('Could not touch tenant:', touchError)
   return NextResponse.json(
    { 
     error: 'Failed to verify tenant in transaction',
     details: touchError?.message || 'Unknown error'
    },
    { status: 400 }
   )
  }

  // Verify user has access to this tenant and check if admin - use verified tenant ID
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, tenant_id, role')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', verifiedTenantId)
   .limit(1)

  if (!employeeData || employeeData.length === 0) {
   return NextResponse.json(
    { error: 'You do not have access to this tenant' },
    { status: 403 }
   )
  }

  // Check if user is admin
  const isAdmin = employeeData[0]?.role === 'admin' || employeeData[0]?.role === 'Admin' || employeeData[0]?.role === 'ADMIN'
  if (!isAdmin) {
   return NextResponse.json(
    { error: 'Admin access required to create ROT applications' },
    { status: 403 }
   )
  }

  // Final verification right before insert - use verified tenant ID
  const finalTenantCheck = await adminSupabase
   .from('tenants')
   .select('id')
   .eq('id', verifiedTenantId)
   .single()

  if (!finalTenantCheck.data || finalTenantCheck.error) {
   console.error('CRITICAL: Tenant not found in final check before insert:', {
    verifiedTenantId,
    error: finalTenantCheck.error
   })
   return NextResponse.json(
    { 
     error: 'Tenant verification failed before insert',
     details: finalTenantCheck.error?.message || 'Tenant not found'
    },
    { status: 400 }
   )
  }
  
  console.log('✅ Final tenant check passed, using tenant_id:', verifiedTenantId)

  // SECURITY: Encrypt personnummer (GDPR compliance)
  let encryptedPnr = ''
  if (customer_person_number) {
   try {
    encryptedPnr = await encryptPnr(customer_person_number)
   } catch (encryptError: any) {
    console.error('Failed to encrypt personnummer:', encryptError)
    // If PNR_ENCRYPTION_KEY is not set, return a clear error
    if (encryptError.message?.includes('PNR_ENCRYPTION_KEY')) {
     return NextResponse.json(
      { error: 'Kryptering av personnummer misslyckades. Kontakta administratören.' },
      { status: 500 }
     )
    }
    return NextResponse.json(
     { error: 'Kunde inte kryptera personnummer. Kontrollera formatet (YYYYMMDD-XXXX).' },
     { status: 400 }
    )
   }
  }

  // Create ROT application - USE VERIFIED TENANT ID FROM DATABASE
  const insertPayload: any = {
   tenant_id: verifiedTenantId, // Use verified tenant ID from database
   project_id: project_id || null,
   client_id: client_id || null,
   customer_person_number: encryptedPnr, // SECURITY: Store encrypted personnummer
   property_designation: property_designation || '',
   work_type: work_type || '',
   work_cost_sek: work_cost_sek || 0,
   material_cost_sek: material_cost_sek || 0,
   total_cost_sek: total_cost_sek || 0,
   status: 'draft',
   created_by: user.id,
  }

  const { data, error } = await adminSupabase
   .from('rot_applications')
   .insert([insertPayload])
   .select()
   .single()

  if (error) {
   console.error('Error creating ROT application:', error)
   
   // Handle foreign key constraint violation
   if (error.code === '23503') {
    // Try to get more details about which foreign key failed
    const { data: tenantVerify } = await adminSupabase
     .from('tenants')
     .select('id')
     .eq('id', verifiedTenantId)
     .single()
    
    const projectVerifyResult = project_id ? await adminSupabase
     .from('projects')
     .select('id')
     .eq('id', project_id)
     .single() : null
    const projectVerify = projectVerifyResult?.data
    
    const clientVerifyResult = client_id ? await adminSupabase
     .from('clients')
     .select('id')
     .eq('id', client_id)
     .single() : null
    const clientVerify = clientVerifyResult?.data
    
    return NextResponse.json(
     { 
      error: 'Foreign key constraint violation',
      details: error.message,
      hint: 'The tenant_id, project_id, client_id, or invoice_id does not exist in the database',
      diagnostics: {
       tenantExists: !!tenantVerify,
       projectExists: project_id ? !!projectVerify : 'N/A',
       clientExists: client_id ? !!clientVerify : 'N/A',
      }
     },
     { status: 400 }
    )
   }

   return NextResponse.json(
    { error: error.message || 'Failed to create ROT application' },
    { status: 500 }
   )
  }

  return NextResponse.json({ data })
 } catch (err: any) {
  console.error('Error in rot/create API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

