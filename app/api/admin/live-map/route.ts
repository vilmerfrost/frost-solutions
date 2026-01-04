import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för live-karta - hämtar alla aktiva incheckade anställda med GPS-positioner
 */
export async function GET() {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Try to get tenant and check admin status
  let tenantId = (user.app_metadata as any)?.tenant_id || null
  let isAdmin = false

  // Use service role for admin check if available
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let adminSupabase: any = null

  if (supabaseUrl && serviceKey) {
   adminSupabase = createAdminClient(supabaseUrl, serviceKey)
  }

  // Check admin status with service role (bypasses RLS)
  if (adminSupabase) {
   // Try to find employee record
   const { data: empData } = await adminSupabase
    .from('employees')
    .select('id, tenant_id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

   if (empData) {
    tenantId = tenantId || empData.tenant_id
    isAdmin = empData.role === 'admin' || 
         empData.role === 'Admin' || 
         empData.role?.toLowerCase() === 'admin' ||
         empData.role?.toLowerCase() === 'administrator'
   }

   // If not found by auth_user_id, try by email
   if (!empData && user.email) {
    const { data: empByEmail } = await adminSupabase
     .from('employees')
     .select('id, tenant_id, role')
     .eq('email', user.email)
     .maybeSingle()

    if (empByEmail) {
     tenantId = tenantId || empByEmail.tenant_id
     isAdmin = empByEmail.role === 'admin' || 
          empByEmail.role === 'Admin' || 
          empByEmail.role?.toLowerCase() === 'admin' ||
          empByEmail.role?.toLowerCase() === 'administrator'
    }
   }
  } else {
   // Fallback: Try with regular client
   const { data: empData } = await supabase
    .from('employees')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

   if (empData) {
    tenantId = tenantId || empData.tenant_id
    isAdmin = empData.role === 'admin' || 
         empData.role === 'Admin' || 
         empData.role?.toLowerCase() === 'admin'
   }
  }

  if (!isAdmin) {
   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  // Use service role if available for RLS bypass
  let querySupabase = supabase
  if (adminSupabase) {
   querySupabase = adminSupabase as any
  }

  // Get all active time entries (checked in but not checked out)
  const { data: activeEntries, error: entriesError } = await querySupabase
   .from('time_entries')
   .select(`
    id,
    employee_id,
    start_time,
    date,
    start_location_lat,
    start_location_lng,
    work_site_id,
    employees:employee_id (
     id,
     name,
     full_name,
     email
    ),
    projects:project_id (
     id,
     name
    ),
    work_sites:work_site_id (
     id,
     name,
     latitude,
     longitude
    )
   `)
   .eq('tenant_id', tenantId)
   .is('end_time', null)

  if (entriesError) {
   console.error('Error fetching active entries:', entriesError)
   return NextResponse.json(
    { error: entriesError.message },
    { status: 500 }
   )
  }

  // Get all work sites
  const { data: workSites, error: sitesError } = await querySupabase
   .from('work_sites')
   .select('id, name, latitude, longitude, radius_meters')
   .eq('tenant_id', tenantId)

  if (sitesError && !sitesError.message.includes('does not exist')) {
   console.error('Error fetching work sites:', sitesError)
  }

  // Format response
  const employeesOnSite = (activeEntries || [])
   .filter((entry: any) => entry.start_location_lat && entry.start_location_lng)
   .map((entry: any) => ({
    id: entry.id,
    employee: {
     id: entry.employees?.id,
     name: entry.employees?.full_name || entry.employees?.name || 'Okänd',
     email: entry.employees?.email,
    },
    project: entry.projects?.name || 'Okänt projekt',
    location: {
     lat: Number(entry.start_location_lat),
     lng: Number(entry.start_location_lng),
    },
    checkedInAt: entry.start_time,
    date: entry.date,
    workSite: entry.work_sites ? {
     id: entry.work_sites.id,
     name: entry.work_sites.name,
     lat: Number(entry.work_sites.latitude),
     lng: Number(entry.work_sites.longitude),
    } : null,
   }))

  return NextResponse.json({
   employees: employeesOnSite,
   workSites: (workSites || []).map((site: any) => ({
    id: site.id,
    name: site.name,
    lat: Number(site.latitude),
    lng: Number(site.longitude),
    radius: site.radius_meters,
   })),
  })
 } catch (err: any) {
  console.error('Error in live-map API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

