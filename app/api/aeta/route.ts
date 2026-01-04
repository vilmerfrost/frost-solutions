import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Hämta alla ÄTA-förfrågningar
export async function GET(req: Request) {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()
 
 if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const { searchParams } = new URL(req.url)
 const tenantId = searchParams.get('tenant_id')
 const status = searchParams.get('status') // 'pending', 'approved', 'rejected'

 // Try with relations first
 let query = supabase
  .from('aeta_requests')
  .select('*, projects(name), employees(full_name)')
  .order('created_at', { ascending: false })

 if (tenantId) {
  query = query.eq('tenant_id', tenantId)
 }

 if (status) {
  query = query.eq('status', status)
 }

 let { data, error } = await query

 // If relation fails, fetch without relations and enrich manually
 if (error && (error.code === 'PGRST200' || error.message?.includes('relationship') || error.message?.includes('Could not find a relationship'))) {
  // Fetch without relations
  let simpleQuery = supabase
   .from('aeta_requests')
   .select('*')
   .order('created_at', { ascending: false })

  if (tenantId) {
   simpleQuery = simpleQuery.eq('tenant_id', tenantId)
  }

  if (status) {
   simpleQuery = simpleQuery.eq('status', status)
  }

  const { data: simpleData, error: simpleError } = await simpleQuery

  if (simpleError) {
   return NextResponse.json({ error: simpleError.message }, { status: 500 })
  }

  // Enrich with project and employee names if data exists
  if (simpleData && simpleData.length > 0) {
   const projectIds = [...new Set(simpleData.map((r: any) => r.project_id).filter(Boolean))]
   const employeeIds = [...new Set(simpleData.map((r: any) => r.employee_id).filter(Boolean))]

   let projects: any[] = []
   let employees: any[] = []

   if (projectIds.length > 0) {
    const { data: projData } = await supabase
     .from('projects')
     .select('id, name')
     .in('id', projectIds)
    projects = projData || []
   }

   if (employeeIds.length > 0) {
    const { data: empData } = await supabase
     .from('employees')
     .select('id, full_name, name')
     .in('id', employeeIds)
    employees = empData || []
   }

   // Enrich the requests
   const enriched = simpleData.map((req: any) => ({
    ...req,
    projects: projects.find(p => p.id === req.project_id) ? { name: projects.find(p => p.id === req.project_id)?.name } : null,
    employees: employees.find(e => e.id === req.employee_id) ? { full_name: employees.find(e => e.id === req.employee_id)?.full_name || employees.find(e => e.id === req.employee_id)?.name } : null,
   }))

   return NextResponse.json({ data: enriched })
  }

  return NextResponse.json({ data: simpleData || [] })
 }

 if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json({ data: data || [] })
}

// Skapa ny ÄTA-förfrågan
export async function POST(req: Request) {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()
 
 if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const body = await req.json()
 const { project_id, description, hours, tenant_id, employee_id } = body

 if (!project_id || !description || !hours || !tenant_id) {
  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
 }

 const { data, error } = await supabase
  .from('aeta_requests')
  .insert([{
   project_id,
   description,
   hours: Number(hours),
   tenant_id,
   employee_id: employee_id || null,
   status: 'pending',
   requested_by: user.id,
  }])
  .select()
  .single()

 if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json({ data }, { status: 201 })
}

