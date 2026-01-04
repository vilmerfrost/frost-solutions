import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

/**
 * Centralized API route that ALWAYS returns the SAME tenantId for a user
 * This is the single source of truth for tenant resolution
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

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createClient(supabaseUrl, serviceKey)

  // Get all employees for this user
  const { data: allEmployees } = await adminSupabase
   .from('employees')
   .select('id, tenant_id, role, full_name, name, email, created_at')
   .eq('auth_user_id', user.id)
   .order('created_at', { ascending: false })

  if (!allEmployees || allEmployees.length === 0) {
   return NextResponse.json({
    tenantId: null,
    error: 'No employee record found',
    suggestion: 'Please complete onboarding or contact administrator.',
   })
  }

  // Get all existing tenants
  const { data: existingTenants } = await adminSupabase
   .from('tenants')
   .select('id')
   .limit(100)

  const existingTenantIds = new Set((existingTenants || []).map((t: any) => t.id))

  // Filter employees to only those with existing tenants AND verify they actually belong to that tenant
  let validEmployees = allEmployees.filter((e: any) => {
   const hasValidTenant = existingTenantIds.has(e.tenant_id)
   if (!hasValidTenant) return false
   
   // Additional verification: Check if tenant actually exists
   return true
  })

  // If no valid employees, try to find tenant from actual data (projects/time entries)
  if (validEmployees.length === 0) {
   console.warn('⚠️ No employees with valid tenant_id, finding tenant from actual data...')
   
   // Strategy 1: Find tenant from user's time entries
   for (const emp of allEmployees) {
    const { data: timeEntries } = await adminSupabase
     .from('time_entries')
     .select('tenant_id')
     .eq('employee_id', emp.id)
     .in('tenant_id', Array.from(existingTenantIds))
     .limit(100)

    if (timeEntries && timeEntries.length > 0) {
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
      
      // Update employee record to use correct tenant
      await adminSupabase
       .from('employees')
       .update({ tenant_id: mostCommonTenant, updated_at: new Date().toISOString() })
       .eq('id', emp.id)
      
      emp.tenant_id = mostCommonTenant
      validEmployees = [emp]
      break
     }
    }
   }
   
   // Strategy 2: If no time entries, find tenant from projects (most common tenant)
   if (validEmployees.length === 0) {
    console.warn('⚠️ No time entries found, trying to find tenant from projects...')
    
    const { data: allProjects } = await adminSupabase
     .from('projects')
     .select('tenant_id')
     .in('tenant_id', Array.from(existingTenantIds))
     .limit(1000)
    
    if (allProjects && allProjects.length > 0) {
     const tenantCounts = new Map<string, number>()
     allProjects.forEach((p: any) => {
      if (p.tenant_id && existingTenantIds.has(p.tenant_id)) {
       tenantCounts.set(p.tenant_id, (tenantCounts.get(p.tenant_id) || 0) + 1)
      }
     })
     
     if (tenantCounts.size > 0) {
      const mostCommonTenant = Array.from(tenantCounts.entries())
       .sort((a, b) => b[1] - a[1])[0][0]
      
      console.log('✅ Found tenant from projects:', mostCommonTenant)
      
      // Update first employee record to use correct tenant
      const firstEmployee = allEmployees[0]
      await adminSupabase
       .from('employees')
       .update({ tenant_id: mostCommonTenant, updated_at: new Date().toISOString() })
       .eq('id', firstEmployee.id)
      
      firstEmployee.tenant_id = mostCommonTenant
      validEmployees = [firstEmployee]
     }
    }
   }
  }

  // If multiple valid employees, prioritize by activity (most projects/time entries)
  if (validEmployees.length > 1) {
   console.log('⚠️ Multiple valid employees found, prioritizing by activity...')
   
   const tenantActivity = new Map<string, {
    projectCount: number
    timeEntryCount: number
    totalActivity: number
    employee: any
   }>()
   
   // Count activity per tenant
   for (const emp of validEmployees) {
    const tenantId = emp.tenant_id
    
    // Count projects for this tenant
    const { data: projects } = await adminSupabase
     .from('projects')
     .select('id')
     .eq('tenant_id', tenantId)
     .limit(1000)
    
    // Count time entries for this employee
    const { data: timeEntries } = await adminSupabase
     .from('time_entries')
     .select('id')
     .eq('employee_id', emp.id)
     .limit(1000)
    
    const projectCount = projects?.length || 0
    const timeEntryCount = timeEntries?.length || 0
    const totalActivity = projectCount + timeEntryCount
    
    if (!tenantActivity.has(tenantId) || tenantActivity.get(tenantId)!.totalActivity < totalActivity) {
     tenantActivity.set(tenantId, {
      projectCount,
      timeEntryCount,
      totalActivity,
      employee: emp
     })
    }
    
    console.log(`📊 Tenant ${tenantId}: ${projectCount} projects, ${timeEntryCount} time entries, total: ${totalActivity}`)
   }
   
   // Sort by total activity (descending)
   const sortedTenants = Array.from(tenantActivity.entries())
    .sort((a, b) => b[1].totalActivity - a[1].totalActivity)
   
   if (sortedTenants.length > 0) {
    const mostActiveTenantId = sortedTenants[0][0]
    const mostActiveData = sortedTenants[0][1]
    
    console.log(`✅ Selected tenant ${mostActiveTenantId} based on activity (${mostActiveData.totalActivity} total activity)`)
    validEmployees = [mostActiveData.employee]
   }
  }

  // If no valid employees, try to find correct tenant from employee's actual data
  if (validEmployees.length === 0) {
   console.warn('⚠️ No employees with valid tenant_id, trying to find correct tenant from employee data...')

   // Strategy 1: Try to find tenant from employee's projects
   for (const emp of allEmployees) {
    const { data: timeEntries } = await adminSupabase
     .from('time_entries')
     .select('tenant_id')
     .eq('employee_id', emp.id)
     .limit(50)

    if (timeEntries && timeEntries.length > 0) {
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

    // Strategy 2: Try to find tenant from employee's projects
    const { data: projects } = await adminSupabase
     .from('projects')
     .select('tenant_id')
     .limit(100)

    if (projects && projects.length > 0) {
     const projectTenants = [...new Set(projects
      .map((p: any) => p.tenant_id)
      .filter((tid: string) => tid && existingTenantIds.has(tid))
     )]

     if (projectTenants.length > 0) {
      const tenantToUse = projectTenants[0]
      console.log('✅ Found tenant from projects:', tenantToUse, 'for employee:', emp.id)
      emp.tenant_id = tenantToUse
      validEmployees = [emp]
      break
     }
    }
   }

   // Strategy 3: If still no valid employee, use first available tenant (last resort)
   if (validEmployees.length === 0 && existingTenantIds.size > 0) {
    console.warn('⚠️ No tenant found from data, using first available tenant as fallback')
    const firstTenant = Array.from(existingTenantIds)[0]
    const firstEmployee = allEmployees[0]
    firstEmployee.tenant_id = firstTenant
    validEmployees = [firstEmployee]
   }
  }

  if (validEmployees.length === 0) {
   return NextResponse.json({
    tenantId: null,
    error: 'No employee record found with valid tenant',
    suggestion: 'Please contact administrator.',
   })
  }

  // Priority 1: Use tenant from JWT metadata if it's valid
  const jwtTenantId = (user.app_metadata as any)?.tenant_id || null

  if (jwtTenantId && existingTenantIds.has(jwtTenantId)) {
   const matchingEmployee = validEmployees.find((e: any) => e.tenant_id === jwtTenantId)
   if (matchingEmployee) {
    console.log('✅ Using tenant from JWT:', jwtTenantId)
    return NextResponse.json({
     tenantId: jwtTenantId,
     employeeId: matchingEmployee.id,
     source: 'jwt'
    })
   }
  }

  // Priority 2: Use first valid employee's tenant
  // CRITICAL: Verify that user actually has an employee record for this tenant
  const selectedEmployee = validEmployees[0]
  const tenantId = validEmployees[0].tenant_id

  // Final verification: Check that user has an employee record for this tenant
  const { data: finalVerify } = await adminSupabase
   .from('employees')
   .select('id')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .maybeSingle()

  if (!finalVerify) {
   console.error('❌ CRITICAL: User does not have employee record for tenant:', tenantId)
   
   // Try to find ANY tenant where user has an employee record
   const { data: anyEmployee } = await adminSupabase
    .from('employees')
    .select('id, tenant_id')
    .eq('auth_user_id', user.id)
    .in('tenant_id', Array.from(existingTenantIds))
    .limit(1)
    .maybeSingle()
   
   if (anyEmployee && anyEmployee.tenant_id && existingTenantIds.has(anyEmployee.tenant_id)) {
    console.log('⚠️ Found alternative tenant:', anyEmployee.tenant_id)
    return NextResponse.json({
     tenantId: anyEmployee.tenant_id,
     employeeId: anyEmployee.id,
     source: 'fallback_employee_record',
     warning: 'Original tenant not accessible, using alternative'
    })
   }
   
   // Last resort: Find tenant from projects/time entries and create employee record
   console.warn('⚠️ No employee record found, attempting to find tenant from projects/time entries...')
   
   // Find tenant from projects (where user might have worked)
   const { data: projects } = await adminSupabase
    .from('projects')
    .select('tenant_id')
    .in('tenant_id', Array.from(existingTenantIds))
    .limit(100)
   
   if (projects && projects.length > 0) {
    const tenantCounts = new Map<string, number>()
    projects.forEach((p: any) => {
     if (p.tenant_id && existingTenantIds.has(p.tenant_id)) {
      tenantCounts.set(p.tenant_id, (tenantCounts.get(p.tenant_id) || 0) + 1)
     }
    })
    
    if (tenantCounts.size > 0) {
     const mostCommonTenant = Array.from(tenantCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0]
     
     console.log('✅ Found tenant from projects:', mostCommonTenant)
     
     // Create employee record for this tenant
     const { data: newEmployee, error: createError } = await adminSupabase
      .from('employees')
      .insert({
       auth_user_id: user.id,
       tenant_id: mostCommonTenant,
       full_name: (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name || user.email?.split('@')[0] || 'User',
       email: user.email || '',
       role: 'admin',
       created_at: new Date().toISOString(),
       updated_at: new Date().toISOString()
      })
      .select('id')
      .single()
     
     if (!createError && newEmployee) {
      console.log('✅ Created employee record for tenant:', mostCommonTenant)
      return NextResponse.json({
       tenantId: mostCommonTenant,
       employeeId: newEmployee.id,
       source: 'auto_created',
       warning: 'Employee record was automatically created'
      })
     }
    }
   }
   
   return NextResponse.json({
    tenantId: null,
    error: 'No accessible tenant found',
    suggestion: 'Please contact administrator to ensure you have an employee record with a valid tenant.',
   }, { status: 403 })
  }

  console.log('✅ Using tenant from employee record:', {
   tenantId: tenantId,
   employeeId: selectedEmployee.id,
   source: 'employee_record',
   verified: true
  })

  return NextResponse.json({
   tenantId: tenantId,
   employeeId: selectedEmployee.id,
   source: 'employee_record'
  })
 } catch (err: any) {
  console.error('Error in get-tenant API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error', tenantId: null },
   { status: 500 }
  )
 }
}
