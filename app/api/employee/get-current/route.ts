import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

/**
 * API route för att hämta current user's employee record
 * Använder service role för att kringgå RLS om nödvändigt
 */
export async function GET() {
 try {
  // Get user from session
  const supabase = createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json(
    { error: 'Not authenticated' },
    { status: 401 }
   )
  }

  // Get service role credentials (defined once at the top, used multiple times)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  let tenantId: string | null = null
  let selectedEmployee: any = null
  
  // Use service role to get all employees and find correct tenant
  if (supabaseUrl && serviceKey) {
   const adminSupabase = createClient(supabaseUrl, serviceKey)
   
   // Get all employees for this user
   const { data: allEmployees } = await adminSupabase
    .from('employees')
    .select('id, tenant_id, role, full_name, name, email, created_at')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })
   
       if (allEmployees && allEmployees.length > 0) {
        // First, check which tenants actually exist in the database
        const { data: existingTenants } = await adminSupabase
         .from('tenants')
         .select('id')
         .limit(100)
        
        const existingTenantIds = new Set((existingTenants || []).map((t: any) => t.id))
        
        // Filter employees to only those with existing tenants
        let validEmployees = allEmployees.filter((e: any) => existingTenantIds.has(e.tenant_id))
        
        // If no valid employees, try to find correct tenant from employee's actual data
        if (validEmployees.length === 0) {
         console.warn('⚠️ No employees with valid tenant_id, trying to find correct tenant from employee data...')
         
         // Strategy 1: Try to find tenant from employee's projects (most reliable)
         for (const emp of allEmployees) {
          // First, try to get projects directly
          const { data: allProjects } = await adminSupabase
           .from('projects')
           .select('tenant_id')
           .limit(100)
          
          if (allProjects && allProjects.length > 0) {
           // Get unique valid tenant_ids from projects
           const projectTenants = [...new Set(allProjects
            .map((p: any) => p.tenant_id)
            .filter((tid: string) => tid && existingTenantIds.has(tid))
           )]
           
           if (projectTenants.length > 0) {
            // Use the first valid tenant (or most common if we want to be smarter)
            const tenantToUse = projectTenants[0]
            console.log('✅ Found tenant from projects:', tenantToUse, 'for employee:', emp.id)
            emp.tenant_id = tenantToUse
            validEmployees = [emp]
            break
           }
          }
          
          // Strategy 2: Try to find tenant from employee's time entries
          const { data: timeEntries } = await adminSupabase
           .from('time_entries')
           .select('tenant_id')
           .eq('employee_id', emp.id)
           .limit(20)
          
          if (timeEntries && timeEntries.length > 0) {
           // Find most common tenant_id from time entries that exists
           const tenantCounts = new Map<string, number>()
           timeEntries.forEach((te: any) => {
            if (te.tenant_id && existingTenantIds.has(te.tenant_id)) {
             tenantCounts.set(te.tenant_id, (tenantCounts.get(te.tenant_id) || 0) + 1)
            }
           })
           
           if (tenantCounts.size > 0) {
            const mostCommonTenant = Array.from(tenantCounts.entries())
             .sort((a, b) => b[1] - a[1])[0][0]
            
            console.log('✅ Found tenant from time_entries:', mostCommonTenant, 'for employee:', emp.id)
            emp.tenant_id = mostCommonTenant
            validEmployees = [emp]
            break
           }
          }
          
          // Strategy 3: Try to find tenant from projects via time entries
          if (timeEntries && timeEntries.length > 0) {
           const projectIds = timeEntries
            .map((te: any) => te.project_id)
            .filter(Boolean)
           
           if (projectIds.length > 0) {
            const { data: projects } = await adminSupabase
             .from('projects')
             .select('tenant_id')
             .in('id', projectIds)
             .limit(20)
            
            if (projects && projects.length > 0) {
             const projectTenants = projects
              .map((p: any) => p.tenant_id)
              .filter((tid: string) => existingTenantIds.has(tid))
             
             if (projectTenants.length > 0) {
              const mostCommonProjectTenant = projectTenants[0]
              console.log('✅ Found tenant from projects (via time_entries):', mostCommonProjectTenant, 'for employee:', emp.id)
              emp.tenant_id = mostCommonProjectTenant
              validEmployees = [emp]
              break
             }
            }
           }
          }
         }
         
         // Strategy 4: If still no valid employee, use first available tenant (last resort)
         if (validEmployees.length === 0 && existingTenantIds.size > 0) {
          console.warn('⚠️ No tenant found from data, using first available tenant as fallback')
          const firstTenant = Array.from(existingTenantIds)[0]
          const firstEmployee = allEmployees[0]
          firstEmployee.tenant_id = firstTenant
          validEmployees = [firstEmployee]
         }
        }
        
        if (validEmployees.length === 0) {
         // No valid employees found - all have non-existent tenants
         console.error('❌ No employees found with valid tenant_id', {
          allEmployees: allEmployees.map((e: any) => ({ id: e.id, tenant_id: e.tenant_id })),
          existingTenants: Array.from(existingTenantIds)
         })
         return NextResponse.json({
          employeeId: null,
          error: 'No employee record found with valid tenant. Please contact administrator.',
         })
        }
        
        // Try to use tenant from JWT metadata first (if it's valid)
        const jwtTenantId = (user.app_metadata as any)?.tenant_id || null
        
        if (jwtTenantId && existingTenantIds.has(jwtTenantId)) {
         const matchingEmployee = validEmployees.find((e: any) => e.tenant_id === jwtTenantId)
         if (matchingEmployee) {
          selectedEmployee = matchingEmployee
          tenantId = jwtTenantId
         }
        }
        
        // If no match from JWT, use first valid employee
        if (!selectedEmployee) {
         selectedEmployee = validEmployees[0]
         tenantId = validEmployees[0].tenant_id
         console.log('✅ Using employee with corrected tenant_id:', {
          employeeId: selectedEmployee.id,
          tenantId: tenantId,
          jwtTenantId: jwtTenantId,
          corrected: !allEmployees.find((e: any) => e.id === selectedEmployee.id && e.tenant_id === tenantId)
         })
        }
    
    console.log('✅ Selected employee:', {
     employeeId: selectedEmployee.id,
     tenantId: tenantId,
     role: selectedEmployee.role
    })
    
    // Return employee immediately if we found a valid one
    if (selectedEmployee && selectedEmployee.id && tenantId) {
     console.log('✅ Returning employee data immediately')
     return NextResponse.json({
      employeeId: selectedEmployee.id,
      role: selectedEmployee.role || null,
      name: selectedEmployee.name || selectedEmployee.full_name || null,
      email: selectedEmployee.email || null,
      tenantId: tenantId,
     })
    } else {
     console.error('❌ Selected employee is invalid:', {
      hasEmployee: !!selectedEmployee,
      hasId: !!selectedEmployee?.id,
      hasTenantId: !!tenantId
     })
    }
   } else {
    console.warn('⚠️ No employees found for user:', user.id)
   }
  } else {
   console.warn('⚠️ Service role not available')
  }
  
  // Fallback: Try to get tenant from JWT metadata (may be invalid, but try anyway)
  tenantId = (user.app_metadata as any)?.tenant_id || null

  if (!tenantId) {
   return NextResponse.json(
    { error: 'No tenant found. Please complete onboarding or log in again.' },
    { status: 400 }
   )
  }

  // Try with regular client first
  const { data: employeeData, error: empError } = await supabase
   .from('employees')
   .select('id, role, name, email, full_name, tenant_id')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .maybeSingle()

  // If found, return it
  if (employeeData) {
   return NextResponse.json({
    employeeId: employeeData.id,
    role: employeeData.role,
    name: employeeData.name,
    email: employeeData.email,
   })
  }

  // If RLS blocked it or not found, try with service role (reuse variables defined above)
  if (supabaseUrl && serviceKey) {
   const adminSupabase = createClient(supabaseUrl, serviceKey)
   
   // Try to find by auth_user_id (get all matches first)
   let { data: adminEmpDataList } = await adminSupabase
    .from('employees')
    .select('id, role, name, email, full_name, auth_user_id, tenant_id, created_at')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false }) // Senaste först
    .limit(10)

   // Get list of existing tenants to filter employees
   const { data: existingTenants } = await adminSupabase
    .from('tenants')
    .select('id')
    .limit(100)
   
   const existingTenantIds = new Set((existingTenants || []).map((t: any) => t.id))
   
   // Filter to only employees with existing tenants
   const validEmployees = (adminEmpDataList || []).filter((e: any) => existingTenantIds.has(e.tenant_id))
   
   let adminEmpData = null
   if (validEmployees.length > 0) {
    // Priority 1: Employee with matching tenant_id (which we verified exists)
    if (tenantId && existingTenantIds.has(tenantId)) {
     adminEmpData = validEmployees.find((e: any) => e.tenant_id === tenantId)
    }
    
    // Priority 2: Use first valid employee if no match
    if (!adminEmpData) {
     adminEmpData = validEmployees[0] || null
    }
   } else {
    console.error('No valid employees found (all have non-existent tenants)', {
     allEmployees: adminEmpDataList?.map((e: any) => ({ id: e.id, tenant_id: e.tenant_id })),
     existingTenants: Array.from(existingTenantIds)
    })
   }

   // If still not found and we have tenantId, try with tenant filter
   if (!adminEmpData && tenantId) {
    const { data: tenantFiltered } = await adminSupabase
     .from('employees')
     .select('id, role, name, email, full_name, tenant_id')
     .eq('auth_user_id', user.id)
     .eq('tenant_id', tenantId)
     .maybeSingle()
    
    adminEmpData = tenantFiltered || adminEmpData
   }

   if (adminEmpData) {
    // Double-check that this employee has a valid tenant_id
    if (adminEmpData.tenant_id && existingTenantIds.has(adminEmpData.tenant_id)) {
     return NextResponse.json({
      employeeId: adminEmpData.id,
      role: adminEmpData.role,
      name: adminEmpData.name || adminEmpData.full_name,
      email: adminEmpData.email,
      tenantId: adminEmpData.tenant_id, // Include tenantId in response
     })
    } else {
     console.error('Selected employee has invalid tenant_id', {
      employeeId: adminEmpData.id,
      tenant_id: adminEmpData.tenant_id,
      existingTenants: Array.from(existingTenantIds)
     })
    }
   }

   // Try by email (only if we have a valid tenantId)
   if (user.email && tenantId && existingTenantIds.has(tenantId)) {
    const { data: adminEmpByEmail } = await adminSupabase
     .from('employees')
     .select('id, role, name, email, full_name, tenant_id')
     .eq('email', user.email)
     .eq('tenant_id', tenantId)
     .maybeSingle()

    if (adminEmpByEmail && existingTenantIds.has(adminEmpByEmail.tenant_id)) {
     return NextResponse.json({
      employeeId: adminEmpByEmail.id,
      role: adminEmpByEmail.role,
      name: adminEmpByEmail.name || adminEmpByEmail.full_name,
      email: adminEmpByEmail.email,
      tenantId: adminEmpByEmail.tenant_id,
     })
    }
   }
  }

  // Not found - return null (not error, so component can handle it)
  return NextResponse.json({
   employeeId: null,
   error: 'Employee record not found',
   suggestion: 'Please complete onboarding step 2 (admin setup) or contact administrator.',
  })
 } catch (err: any) {
  console.error('Error in get-current employee API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

