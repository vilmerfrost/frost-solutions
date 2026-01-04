import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * PUT: Update work site
 * DELETE: Delete work site
 */
export async function PUT(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id } = await params
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

  const { data, error } = await adminSupabase
   .from('work_sites')
   .update(payload as any)
   .eq('id', id)
   .select()
   .single()

  if (error) throw error

  return NextResponse.json({ workSite: data })
 } catch (err: any) {
  console.error('Error in work-sites PUT:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

export async function DELETE(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id } = await params
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

  const { error } = await adminSupabase
   .from('work_sites')
   .delete()
   .eq('id', id)

  if (error) throw error

  return NextResponse.json({ success: true })
 } catch (err: any) {
  console.error('Error in work-sites DELETE:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

