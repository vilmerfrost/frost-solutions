import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för att hämta anställdas timmar per projekt
 */
export async function GET(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
   return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
  }

  // Get tenant ID from user's employee record
  const { data: employeeData } = await supabase
   .from('employees')
   .select('tenant_id')
   .eq('auth_user_id', user.id)
   .maybeSingle()

  if (!employeeData?.tenant_id) {
   return NextResponse.json({ error: 'No tenant ID found' }, { status: 400 })
  }

  const tenantId = employeeData.tenant_id

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Fetch time entries grouped by employee
  const { data: entries, error } = await adminSupabase
   .from('time_entries')
   .select(`
    employee_id,
    hours_total,
    date,
    employees!inner(full_name, email)
   `)
   .eq('project_id', projectId)
   .eq('tenant_id', tenantId)
   .order('date', { ascending: false })

  if (error) {
   // Fallback without relation
   const { data: entriesData, error: entriesError } = await adminSupabase
    .from('time_entries')
    .select('employee_id, hours_total, date')
    .eq('project_id', projectId)
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })

   if (entriesError) {
    return NextResponse.json(
     { error: entriesError.message || 'Failed to fetch employee hours' },
     { status: 500 }
    )
   }

   // Get employee names separately
   const employeeIds = [...new Set((entriesData || []).map((e: any) => e.employee_id).filter(Boolean))]
   
   if (employeeIds.length === 0) {
    return NextResponse.json({
     employees: [],
     totalHours: 0
    })
   }

   const { data: employeesData } = await adminSupabase
    .from('employees')
    .select('id, full_name, email')
    .in('id', employeeIds)
    .eq('tenant_id', tenantId)

   const employeeMap = new Map(
    (employeesData || []).map((e: any) => [e.id, { full_name: e.full_name || 'Okänd', email: e.email || '' }])
   )

   // Group by employee
   const grouped = new Map<string, { name: string; email: string; hours: number; entries: any[] }>()
   
   ;(entriesData || []).forEach((entry: any) => {
    if (!entry.employee_id) return // Skip entries without employee_id
    
    const emp = employeeMap.get(entry.employee_id) || { full_name: 'Okänd', email: '' }
    if (!grouped.has(entry.employee_id)) {
     grouped.set(entry.employee_id, {
      name: emp.full_name,
      email: emp.email,
      hours: 0,
      entries: []
     })
    }
    const empData = grouped.get(entry.employee_id)!
    empData.hours += Number(entry.hours_total || 0)
    empData.entries.push(entry)
   })

   return NextResponse.json({
    employees: Array.from(grouped.values()).sort((a, b) => b.hours - a.hours),
    totalHours: Array.from(grouped.values()).reduce((sum, e) => sum + e.hours, 0)
   })
  }

  // Group by employee
  const grouped = new Map<string, { name: string; email: string; hours: number; entries: any[] }>()
  
  ;(entries || []).forEach((entry: any) => {
   const empId = entry.employee_id
   const empName = entry.employees?.full_name || 'Okänd'
   const empEmail = entry.employees?.email || ''
   
   if (!grouped.has(empId)) {
    grouped.set(empId, {
     name: empName,
     email: empEmail,
     hours: 0,
     entries: []
    })
   }
   const empData = grouped.get(empId)!
   empData.hours += Number(entry.hours_total || 0)
   empData.entries.push(entry)
  })

  return NextResponse.json({
   employees: Array.from(grouped.values()).sort((a, b) => b.hours - a.hours),
   totalHours: Array.from(grouped.values()).reduce((sum, e) => sum + e.hours, 0)
  })
 } catch (err: any) {
  console.error('Error in projects/[id]/employee-hours:', err)
  return NextResponse.json(
   { error: 'Internal server error', details: err.message },
   { status: 500 }
  )
 }
}

