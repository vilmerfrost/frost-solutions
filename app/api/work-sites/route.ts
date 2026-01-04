import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * GET: List all work sites for tenant
 * POST: Create new work site
 */
export async function GET() {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use service role to get tenant and check admin
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Get tenant from employee record
  let tenantId = (user.app_metadata as any)?.tenant_id || null

  // Get tenant from employee if not in metadata
  if (!tenantId) {
   const { data: empData } = await adminSupabase
    .from('employees')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .limit(1)
    .maybeSingle()
   
   if (empData?.tenant_id) {
    tenantId = empData.tenant_id
   } else if (user.email) {
    // Try by email as fallback
    const { data: emailEmpData } = await adminSupabase
     .from('employees')
     .select('tenant_id')
     .eq('email', user.email)
     .limit(1)
     .maybeSingle()
    
    if (emailEmpData?.tenant_id) {
     tenantId = emailEmpData.tenant_id
    }
   }
  }

  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  // Fetch work sites using service role (bypasses RLS)
  const { data, error } = await adminSupabase
   .from('work_sites')
   .select('*')
   .eq('tenant_id', tenantId)
   .order('name', { ascending: true })

  if (error) {
   if (error.message.includes('does not exist')) {
    return NextResponse.json(
     { error: 'Work sites table does not exist. Run SUPABASE_CREATE_WORK_SITES.sql first.' },
     { status: 404 }
    )
   }
   throw error
  }

  return NextResponse.json({ workSites: data || [] })
 } catch (err: any) {
  console.error('Error in work-sites GET:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

export async function POST(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use service role to check admin status
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Check admin status directly via employee record
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role, tenant_id')
   .eq('auth_user_id', user.id)
   .limit(10)

  // Also try by email as fallback
  let isAdmin = false
  let adminEmployee = null
  
  // Find admin employee
  if (employeeData && Array.isArray(employeeData)) {
   adminEmployee = employeeData.find((e: any) => 
    e.role === 'admin' || e.role === 'Admin' || e.role === 'ADMIN'
   )
   if (adminEmployee) {
    isAdmin = true
   }
  } else if (employeeData && (employeeData.role === 'admin' || employeeData.role === 'Admin' || employeeData.role === 'ADMIN')) {
   adminEmployee = employeeData
   isAdmin = true
  }
  
  if (!isAdmin && user.email) {
   const { data: emailEmployeeList } = await adminSupabase
    .from('employees')
    .select('id, role, tenant_id')
    .eq('email', user.email)
    .limit(10)
   
   if (emailEmployeeList && Array.isArray(emailEmployeeList)) {
    adminEmployee = emailEmployeeList.find((e: any) => 
     e.role === 'admin' || e.role === 'Admin' || e.role === 'ADMIN'
    )
    if (adminEmployee) {
     isAdmin = true
    }
   } else if (emailEmployeeList && (emailEmployeeList.role === 'admin' || emailEmployeeList.role === 'Admin' || emailEmployeeList.role === 'ADMIN')) {
    adminEmployee = emailEmployeeList
    isAdmin = true
   }
  }

  if (!isAdmin) {
   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const payload = await req.json()
  const { tenant_id, name, latitude, longitude, radius_meters, auto_checkin_enabled, auto_checkin_distance, address } = payload

  if (!tenant_id || !name || latitude === undefined || longitude === undefined) {
   return NextResponse.json(
    { error: 'Missing required fields: tenant_id, name, latitude, longitude' },
    { status: 400 }
   )
  }

  // Verify tenant_id belongs to admin
  const adminTenantId = adminEmployee?.tenant_id

  if (adminTenantId && tenant_id !== adminTenantId) {
   return NextResponse.json(
    { error: 'Tenant ID mismatch' },
    { status: 403 }
   )
  }

  const insertPayload: any = {
   tenant_id: tenant_id || adminTenantId,
   name,
   latitude,
   longitude,
   radius_meters: radius_meters || 100,
   auto_checkin_enabled: auto_checkin_enabled || false,
   auto_checkin_distance: auto_checkin_distance || 500,
  }

  if (address) {
   insertPayload.address = address
  }

  const { data, error } = await adminSupabase
   .from('work_sites')
   .insert([insertPayload] as any)
   .select()
   .single()

  if (error) throw error

  return NextResponse.json({ workSite: data })
 } catch (err: any) {
  console.error('Error in work-sites POST:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

