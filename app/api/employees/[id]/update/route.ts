import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP, sanitizeString, isValidEmail, isValidUUID } from '@/lib/security'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route för att uppdatera anställda (endast admins)
 */
export async function PATCH(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id } = await params
  
  // Rate limiting
  const clientIP = getClientIP(req)
  const rateLimit = checkRateLimit(`employee_update:${clientIP}`, 20, 60 * 60 * 1000)
  
  if (!rateLimit.allowed) {
   return NextResponse.json(
    { 
     error: 'För många förfrågningar. Försök igen om ' + rateLimit.retryAfter + ' sekunder.',
     retryAfter: rateLimit.retryAfter
    },
    { status: 429 }
   )
  }

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

  // Get tenant ID
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json(
    { error: 'No tenant found' },
    { status: 403 }
   )
  }

  // Check admin status - must be admin in the same tenant
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role, tenant_id')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId) // Must be in same tenant
   .limit(10)

  let isAdmin = false
  let adminEmployee = null
  
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
  
  // Fallback: Try by email if not found by auth_user_id
  if (!isAdmin && user.email) {
   const { data: emailEmployeeList } = await adminSupabase
    .from('employees')
    .select('id, role, tenant_id')
    .eq('email', user.email)
    .eq('tenant_id', tenantId) // Must be in same tenant
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
   console.error('Admin check failed:', {
    userId: user.id,
    userEmail: user.email,
    tenantId,
    employeeData: employeeData || null
   })
   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Verify that the employee being updated belongs to the same tenant
  const { data: targetEmployee } = await adminSupabase
   .from('employees')
   .select('id, tenant_id')
   .eq('id', id)
   .single()

  if (!targetEmployee) {
   return NextResponse.json(
    { error: 'Employee not found' },
    { status: 404 }
   )
  }

  if (targetEmployee.tenant_id !== tenantId) {
   return NextResponse.json(
    { error: 'Access denied: Employee belongs to different tenant' },
    { status: 403 }
   )
  }

  const { name, full_name, email, role, base_rate_sek, default_rate_sek } = await req.json()

  // Input validation
  if (!isValidUUID(id)) {
   return NextResponse.json(
    { error: 'Ogiltigt employee ID' },
    { status: 400 }
   )
  }

  // Build update payload
  const updatePayload: any = {}

  if (name) {
   updatePayload.name = sanitizeString(name.trim())
  }

  if (full_name) {
   updatePayload.full_name = sanitizeString(full_name.trim())
  }

  if (email !== undefined) {
   if (email && !isValidEmail(email)) {
    return NextResponse.json(
     { error: 'Ogiltig email-address' },
     { status: 400 }
    )
   }
   updatePayload.email = email ? email.trim().toLowerCase() : null
  }

  if (role) {
   const validRoles = ['employee', 'admin']
   const normalizedRole = typeof role === 'string' && validRoles.includes(role.toLowerCase())
    ? role.toLowerCase()
    : 'employee'
   updatePayload.role = normalizedRole
  }

  // Only add rate fields if they're provided
  if (base_rate_sek !== undefined) {
   updatePayload.base_rate_sek = Math.max(0, Math.min(1000000, Number(base_rate_sek)))
  }

  if (default_rate_sek !== undefined) {
   updatePayload.default_rate_sek = Math.max(0, Math.min(1000000, Number(default_rate_sek)))
  }

  // Update employee - try with all fields first
  let updateResult = await adminSupabase
   .from('employees')
   .update(updatePayload)
   .eq('id', id)
   .eq('tenant_id', tenantId) // Extra security: ensure tenant matches
   .select('id')
   .single()

  // Fallback: try without default_rate_sek if column doesn't exist
  if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('default_rate_sek'))) {
   const { default_rate_sek: _, ...payloadWithoutDefaultRate } = updatePayload
   updateResult = await adminSupabase
    .from('employees')
    .update(payloadWithoutDefaultRate)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('id')
    .single()
  }

  // Fallback: try without base_rate_sek if column doesn't exist
  if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('base_rate_sek'))) {
   const { base_rate_sek: _, ...payloadWithoutBaseRate } = updatePayload
   updateResult = await adminSupabase
    .from('employees')
    .update(payloadWithoutBaseRate)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('id')
    .single()
  }

  // Fallback: try without both rate fields if neither exists
  if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('rate'))) {
   const { base_rate_sek: _, default_rate_sek: __, ...payloadWithoutRates } = updatePayload
   updateResult = await adminSupabase
    .from('employees')
    .update(payloadWithoutRates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('id')
    .single()
  }

  if (updateResult.error) {
   console.error('Error updating employee:', updateResult.error)
   return NextResponse.json(
    { error: updateResult.error.message || 'Failed to update employee' },
    { status: 500 }
   )
  }

  return NextResponse.json({ employee: updateResult.data })
 } catch (err: any) {
  console.error('Error in employees/[id]/update API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

