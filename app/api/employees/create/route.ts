import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP, sanitizeString, isValidEmail, isValidUUID } from '@/lib/security'

/**
 * API route för att skapa employees med service role
 * Hanterar saknade kolumner progressivt
 */
export async function POST(req: Request) {
 try {
  // Rate limiting - max 10 employee creations per IP per hour
  const clientIP = getClientIP(req)
  const rateLimit = checkRateLimit(`employee_create:${clientIP}`, 10, 60 * 60 * 1000)
  
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

  // Use service role to check admin status directly
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
  } else if (employeeData) {
   const emp = employeeData as any
   if (emp.role === 'admin' || emp.role === 'Admin' || emp.role === 'ADMIN') {
    adminEmployee = emp
    isAdmin = true
   }
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
   } else if (emailEmployeeList) {
    const emp = emailEmployeeList as any
    if (emp.role === 'admin' || emp.role === 'Admin' || emp.role === 'ADMIN') {
     adminEmployee = emp
     isAdmin = true
    }
   }
  }

  if (!isAdmin) {
   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { tenant_id, name, full_name, email, role, base_rate_sek, default_rate_sek } = await req.json()

  // Input validation
  if (!tenant_id || !isValidUUID(tenant_id)) {
   return NextResponse.json(
    { error: 'Ogiltig tenant_id (måste vara UUID)' },
    { status: 400 }
   )
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
   return NextResponse.json(
    { error: 'Namn krävs och måste vara en sträng' },
    { status: 400 }
   )
  }

  // Sanitize inputs
  const sanitizedName = sanitizeString(name.trim())
  const sanitizedFullName = full_name ? sanitizeString(full_name.trim()) : sanitizedName
  
  if (email && !isValidEmail(email)) {
   return NextResponse.json(
    { error: 'Ogiltig email-address' },
    { status: 400 }
   )
  }

  // Validate role - ensure it matches database constraint exactly
  // Constraint accepts: 'employee', 'admin', 'Employee', 'Admin'
  // We'll use lowercase to be consistent
  const validRoles = ['employee', 'admin']
  let sanitizedRole = 'employee' // Default
  
  if (role && typeof role === 'string') {
   const roleLower = role.toLowerCase()
   if (validRoles.includes(roleLower)) {
    sanitizedRole = roleLower
   }
  }

  // Validate rates
  const sanitizedBaseRate = base_rate_sek ? Math.max(0, Math.min(1000000, Number(base_rate_sek))) : 360
  const sanitizedDefaultRate = default_rate_sek ? Math.max(0, Math.min(1000000, Number(default_rate_sek))) : sanitizedBaseRate

  // adminSupabase is already created above for admin check
  // Reuse it here for employee creation

  // Build payload progressively (using sanitized values)
  const payload: any = {
   tenant_id,
   role: sanitizedRole, // Explicitly set to lowercase
   name: sanitizedName,
  }
  
  // Debug logging
  console.log('[Employee Create] Payload role:', sanitizedRole, 'Original role:', role)

  // Add name or full_name (try both)
  if (sanitizedFullName) {
   payload.full_name = sanitizedFullName
  }
  if (email) {
   payload.email = email.trim().toLowerCase()
  }

  // Add rates only if they exist in schema
  // Try with both first
  let insertResult = await adminSupabase
   .from('employees')
   .insert([{
    ...payload,
    base_rate_sek: sanitizedBaseRate,
    default_rate_sek: sanitizedDefaultRate,
   }])
   .select('id')
   .single()

  // Fallback: try without default_rate_sek
  if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('default_rate_sek'))) {
   insertResult = await adminSupabase
    .from('employees')
   .insert([{
    ...payload,
    base_rate_sek: sanitizedBaseRate,
   }])
    .select('id')
    .single()
  }

  // Fallback: try without base_rate_sek
  if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('base_rate_sek'))) {
   insertResult = await adminSupabase
    .from('employees')
    .insert([payload])
    .select('id')
    .single()
  }

  // Fallback: try without full_name
  if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('full_name'))) {
   const { full_name: _, ...payloadWithoutFullName } = payload
   insertResult = await adminSupabase
    .from('employees')
    .insert([payloadWithoutFullName])
    .select('id')
    .single()
  }

  // Fallback: try without email
  if (insertResult.error && (insertResult.error.code === '42703' || insertResult.error.message?.includes('email'))) {
   const { email: _, ...payloadWithoutEmail } = payload
   insertResult = await adminSupabase
    .from('employees')
    .insert([payloadWithoutEmail])
    .select('id')
    .single()
  }

  if (insertResult.error) {
   console.error('Error creating employee (all fallbacks failed):', insertResult.error)
   console.error('Payload that failed:', JSON.stringify(payload, null, 2))
   console.error('Role value:', sanitizedRole, 'Type:', typeof sanitizedRole)
   
   // Provide more helpful error message
   let errorMessage = insertResult.error.message || 'Failed to create employee'
   if (insertResult.error.message?.includes('employees_role_check')) {
    errorMessage = `Ogiltig roll-värde: "${sanitizedRole}". Tillåtna värden: 'employee', 'admin', 'Employee', 'Admin'`
   }
   
   return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
   )
  }

  return NextResponse.json({ employee: insertResult.data })
 } catch (err: any) {
  console.error('Error in employees/create API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

