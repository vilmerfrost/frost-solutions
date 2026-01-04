import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för att hämta current user's tenant_id
 * Använder service role om RLS blockerar
 */
export async function GET() {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json(
    { error: 'Not authenticated', tenantId: null },
    { status: 401 }
   )
  }

  // Try with regular client first
  const { data: employeeData } = await supabase
   .from('employees')
   .select('tenant_id')
   .eq('auth_user_id', user.id)
   .maybeSingle()

  if (employeeData?.tenant_id) {
   return NextResponse.json({ tenantId: employeeData.tenant_id })
  }

  // Try with email
  if (user.email) {
   const { data: emailEmpData } = await supabase
    .from('employees')
    .select('tenant_id')
    .eq('email', user.email)
    .maybeSingle()

   if (emailEmpData?.tenant_id) {
    return NextResponse.json({ tenantId: emailEmpData.tenant_id })
   }
  }

  // Fallback to service role
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && serviceKey) {
   const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

   // Get all employees for this user
   const { data: allEmployees } = await adminSupabase
    .from('employees')
    .select('id, tenant_id')
    .eq('auth_user_id', user.id)
    .limit(10)
   
   if (allEmployees && allEmployees.length > 0) {
    // Get existing tenants to filter invalid ones
    const { data: existingTenants } = await adminSupabase
     .from('tenants')
     .select('id')
     .limit(100)
    
    const existingTenantIds = new Set((existingTenants || []).map((t: any) => t.id))
    
    // Find employee with existing tenant (prioritize first valid one)
    const validEmployee = allEmployees.find((e: any) => existingTenantIds.has(e.tenant_id))
    
    if (validEmployee?.tenant_id) {
     return NextResponse.json({ tenantId: validEmployee.tenant_id })
    }
   }

   // Fallback: Try by email
   if (user.email) {
    const { data: adminEmailEmpData } = await adminSupabase
     .from('employees')
     .select('tenant_id')
     .eq('email', user.email)
     .limit(1)
     .maybeSingle()

    if (adminEmailEmpData?.tenant_id) {
     // Verify tenant exists
     const { data: tenantCheck } = await adminSupabase
      .from('tenants')
      .select('id')
      .eq('id', adminEmailEmpData.tenant_id)
      .single()
     
     if (tenantCheck) {
      return NextResponse.json({ tenantId: adminEmailEmpData.tenant_id })
     }
    }
   }
  }

  return NextResponse.json({
   tenantId: null,
   error: 'No tenant found',
   suggestion: 'Please complete onboarding or contact administrator.',
  })
 } catch (err: any) {
  console.error('Error in get-current tenant API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error', tenantId: null },
   { status: 500 }
  )
 }
}

