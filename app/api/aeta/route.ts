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

 // Fetch without relations and enrich manually
 let query = supabase
  .from('aeta_requests')
  .select('*')
  .order('created_at', { ascending: false })

 if (tenantId) {
  query = query.eq('tenant_id', tenantId)
 }

 if (status) {
  query = query.eq('status', status)
 }

 const { data: simpleData, error: simpleError } = await query

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

// Skapa ny ÄTA-förfrågan (enhanced with new fields)
export async function POST(req: Request) {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()
 
 if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const body = await req.json()
 const { 
  project_id, 
  title,
  description, 
  change_type,
  photos,
  estimated_hours_category,
  estimated_material_cost,
  ordered_by_name,
  hours, 
  tenant_id, 
  employee_id 
 } = body

 // Validate required fields
 if (!project_id || !tenant_id) {
  return NextResponse.json({ error: 'Missing required fields: project_id and tenant_id' }, { status: 400 })
 }

 // New form requires title and change_type, but support legacy form with just description
 if (!title && !description) {
  return NextResponse.json({ error: 'Missing required field: title or description' }, { status: 400 })
 }

 // Validate photos for UNFORESEEN type
 if (change_type === 'UNFORESEEN' && (!photos || photos.length === 0)) {
  return NextResponse.json({ 
   error: 'Vid oförutsett arbete krävs minst ett foto som dokumentation' 
  }, { status: 400 })
 }

 // Build insert payload
 const insertPayload: any = {
  project_id,
  tenant_id,
  employee_id: employee_id || null,
  status: 'pending',
  requested_by: user.id,
  customer_approval_status: 'DRAFT',
 }

 // Add new fields if provided
 if (title) insertPayload.title = title
 if (description) insertPayload.description = description
 if (change_type) insertPayload.change_type = change_type
 if (photos && photos.length > 0) insertPayload.photos = photos
 if (estimated_hours_category) insertPayload.estimated_hours_category = estimated_hours_category
 if (estimated_material_cost) insertPayload.estimated_material_cost = Number(estimated_material_cost)
 if (ordered_by_name) insertPayload.ordered_by_name = ordered_by_name
 
 // Legacy support: hours field
 if (hours) insertPayload.hours = Number(hours)

 const { data, error } = await (supabase
  .from('aeta_requests') as any)
  .insert([insertPayload])
  .select()
  .single()

 if (error) {
  console.error('Error creating ÄTA request:', error)
  return NextResponse.json({ error: error.message }, { status: 500 })
 }

 return NextResponse.json({ data }, { status: 201 })
}
