import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för att kontrollera om användare är admin
 * Använder service role för att kringgå RLS
 */
export async function GET() {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 })
  }

  // Try to get tenant from JWT/cookie first
  let tenantId = (user.app_metadata as any)?.tenant_id || null

  // If no tenant in metadata, try to get from employees table
  if (!tenantId) {
   const { data: empCheck } = await supabase
    .from('employees')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
   
   if (empCheck?.tenant_id) {
    tenantId = empCheck.tenant_id
   }
  }

  if (!tenantId) {
   return NextResponse.json({ 
    isAdmin: false, 
    error: 'No tenant found',
    suggestion: 'Please complete onboarding or log in again.'
   })
  }

  // Try with regular client first
  const { data: employeeData } = await supabase
   .from('employees')
   .select('id, role, tenant_id')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .maybeSingle()

  // Check if admin
  if (employeeData) {
   const isAdmin = employeeData.role === 'admin' || 
           employeeData.role === 'Admin' || 
           employeeData.role?.toLowerCase() === 'admin' ||
           employeeData.role?.toLowerCase() === 'administrator'
   
   return NextResponse.json({
    isAdmin,
    employeeId: employeeData.id,
    role: employeeData.role,
    tenantId: employeeData.tenant_id,
   })
  }

  // Always use service role for reliable admin check
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && serviceKey) {
   const adminSupabase = createAdminClient(supabaseUrl, serviceKey)
   
   // Try to find by auth_user_id first (get all matches, handle array)
   let { data: adminEmpDataList } = await adminSupabase
    .from('employees')
    .select('id, role, tenant_id, auth_user_id, email')
    .eq('auth_user_id', user.id)
    .limit(10)

   let adminEmpData = null
   if (adminEmpDataList && Array.isArray(adminEmpDataList)) {
    // If we have tenantId, prefer that match
    if (tenantId) {
     adminEmpData = adminEmpDataList.find((e: any) => e.tenant_id === tenantId) || adminEmpDataList[0] || null
    } else {
     adminEmpData = adminEmpDataList[0] || null
    }
   }

   if (adminEmpData) {
    const isAdmin = adminEmpData.role === 'admin' || 
            adminEmpData.role === 'Admin' || 
            String(adminEmpData.role || '').toLowerCase() === 'admin' ||
            String(adminEmpData.role || '').toLowerCase() === 'administrator'
    
    return NextResponse.json({
     isAdmin,
     employeeId: adminEmpData.id,
     role: adminEmpData.role,
     tenantId: adminEmpData.tenant_id || tenantId,
     foundBy: 'auth_user_id',
    })
   }

   // Try by email if not found by auth_user_id
   if (user.email) {
    let { data: adminEmpByEmailList } = await adminSupabase
     .from('employees')
     .select('id, role, tenant_id, auth_user_id, email')
     .eq('email', user.email)
     .limit(10)

    if (adminEmpByEmailList && Array.isArray(adminEmpByEmailList)) {
     if (tenantId) {
      adminEmpData = adminEmpByEmailList.find((e: any) => e.tenant_id === tenantId) || adminEmpByEmailList[0] || null
     } else {
      adminEmpData = adminEmpByEmailList[0] || null
     }
    }

    if (adminEmpData) {
     const isAdmin = adminEmpData.role === 'admin' || 
             adminEmpData.role === 'Admin' || 
             String(adminEmpData.role || '').toLowerCase() === 'admin' ||
             String(adminEmpData.role || '').toLowerCase() === 'administrator'
     
     return NextResponse.json({
      isAdmin,
      employeeId: adminEmpData.id,
      role: adminEmpData.role,
      tenantId: adminEmpData.tenant_id || tenantId,
      foundBy: 'email',
     })
    }
   }
  } else {
   console.warn('Service role key not configured - admin check may be unreliable')
  }

  // Not found
  return NextResponse.json({
   isAdmin: false,
   error: 'Employee record not found',
   suggestion: 'Please complete onboarding step 2 (admin setup) or contact administrator.',
  })
 } catch (err: any) {
  console.error('Error in admin check API:', err)
  // Log full error for debugging
  console.error('Full error details:', {
   message: err.message,
   stack: err.stack,
   name: err.name
  })
  return NextResponse.json(
   { 
    isAdmin: false, 
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
   },
   { status: 500 }
  )
 }
}

