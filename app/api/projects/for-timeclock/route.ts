import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för att hämta projekt för TimeClock
 * Använder service role för att kringgå RLS om nödvändigt
 * ANVÄNDER samma tenant-resolution logik som /api/tenant/get-tenant för konsistens
 */
export async function GET() {
 try {
  const supabase = createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role not configured', projects: [] },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Get tenant ID using same logic as /api/tenant/get-tenant (for consistency)
  let tenantId: string | null = null
  
  // Get all employees for this user
  const { data: allEmployees } = await adminSupabase
   .from('employees')
   .select('id, tenant_id, role, full_name, name, email, created_at')
   .eq('auth_user_id', user.id)
   .order('created_at', { ascending: false })

  if (!allEmployees || allEmployees.length === 0) {
   return NextResponse.json(
    { error: 'No employee record found', projects: [] },
    { status: 400 }
   )
  }

  // Get all existing tenants
  const { data: existingTenants } = await adminSupabase
   .from('tenants')
   .select('id')
   .limit(100)

  const existingTenantIds = new Set((existingTenants || []).map((t: any) => t.id))

  // Filter employees to only those with existing tenants
  let validEmployees = allEmployees.filter((e: any) => existingTenantIds.has(e.tenant_id))

  // If no valid employees, try to find correct tenant from employee's actual data
  if (validEmployees.length === 0) {
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

      emp.tenant_id = mostCommonTenant
      validEmployees = [emp]
      break
     }
    }
   }
  }

  if (validEmployees.length === 0) {
   return NextResponse.json(
    { error: 'No employee record found with valid tenant', projects: [] },
    { status: 400 }
   )
  }

  // Priority 1: Use tenant from JWT metadata if it's valid
  const jwtTenantId = (user.app_metadata as any)?.tenant_id || null

  if (jwtTenantId && existingTenantIds.has(jwtTenantId)) {
   const matchingEmployee = validEmployees.find((e: any) => e.tenant_id === jwtTenantId)
   if (matchingEmployee) {
    tenantId = jwtTenantId
   }
  }

  // Priority 2: Use first valid employee's tenant
  if (!tenantId) {
   tenantId = validEmployees[0].tenant_id
  }

  if (!tenantId) {
   return NextResponse.json(
    { error: 'No tenant found', projects: [] },
    { status: 400 }
   )
  }

  console.log('✅ Projects/for-timeclock: Using tenantId:', tenantId)

  // Try to fetch projects with service role (bypasses RLS)
  let { data: projects, error } = await adminSupabase
   .from('projects')
   .select('id, name, tenant_id, status')
   .eq('tenant_id', tenantId)
   .order('name', { ascending: true })

  if (error) {
   // Fallback: try without status column
   const fallback = await adminSupabase
    .from('projects')
    .select('id, name, tenant_id')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })
   
   if (fallback.error) {
    console.error('Error fetching projects:', fallback.error)
    return NextResponse.json(
     { error: fallback.error.message, projects: [] },
     { status: 500 }
    )
   }
   
   projects = fallback.data?.map(p => ({ ...p, status: 'active' as const })) ?? null
  }

  // Filter out completed/archived projects
  const filteredProjects = projects
   ? projects
      .filter((p: any) => {
       if (!p.status) return true
       return p.status !== 'completed' && p.status !== 'archived'
      })
      .map((p: any) => ({ id: p.id, name: p.name }))
   : []

  return NextResponse.json({
   projects: filteredProjects,
   tenantId: tenantId,
  })
 } catch (err: any) {
  console.error('Error in projects for timeclock API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error', projects: [] },
   { status: 500 }
  )
 }
}

