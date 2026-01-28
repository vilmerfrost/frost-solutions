import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP, sanitizeString, isValidEmail, isValidUUID } from '@/lib/security'

/**
 * API route för att skapa employees med service role
 * Hanterar alla nya fält för enhanced employee system
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

  let isAdmin = false
  let adminEmployee = null
  
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

  const body = await req.json()
  const { 
   tenant_id, 
   name, 
   full_name, 
   first_name,
   last_name,
   email, 
   role, 
   base_rate_sek, 
   default_rate_sek,
   // New enhanced fields
   phone,
   personal_id,
   employment_type,
   job_role,
   start_date,
   has_drivers_license,
   is_over_19,
   has_safety_training,
   has_rot_eligibility,
   has_electrical_cert,
   has_fall_protection,
   monthly_salary_gross,
   emergency_contact_name,
   emergency_contact_phone,
   notes,
  } = body

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

  // Validate role
  const validRoles = ['employee', 'admin']
  let sanitizedRole = 'employee'
  
  if (role && typeof role === 'string') {
   const roleLower = role.toLowerCase()
   if (validRoles.includes(roleLower)) {
    sanitizedRole = roleLower
   }
  }

  // Validate rates
  const sanitizedBaseRate = base_rate_sek ? Math.max(0, Math.min(1000000, Number(base_rate_sek))) : 360
  const sanitizedDefaultRate = default_rate_sek ? Math.max(0, Math.min(1000000, Number(default_rate_sek))) : sanitizedBaseRate

  // Build payload with all fields
  const payload: any = {
   tenant_id,
   role: sanitizedRole,
   name: sanitizedName,
   full_name: sanitizedFullName,
   base_rate_sek: sanitizedBaseRate,
  }

  // Add optional fields
  if (first_name) payload.first_name = sanitizeString(first_name.trim())
  if (last_name) payload.last_name = sanitizeString(last_name.trim())
  if (email) payload.email = email.trim().toLowerCase()
  if (phone) payload.phone = phone.trim()
  if (personal_id) payload.personal_id = personal_id.trim()
  if (employment_type) payload.employment_type = employment_type
  if (job_role) payload.job_role = job_role
  if (start_date) payload.start_date = start_date
  
  // Competencies (booleans)
  if (has_drivers_license !== undefined) payload.has_drivers_license = !!has_drivers_license
  if (is_over_19 !== undefined) payload.is_over_19 = !!is_over_19
  if (has_safety_training !== undefined) payload.has_safety_training = !!has_safety_training
  if (has_rot_eligibility !== undefined) payload.has_rot_eligibility = !!has_rot_eligibility
  if (has_electrical_cert !== undefined) payload.has_electrical_cert = !!has_electrical_cert
  if (has_fall_protection !== undefined) payload.has_fall_protection = !!has_fall_protection
  
  // Salary
  if (monthly_salary_gross) payload.monthly_salary_gross = Number(monthly_salary_gross)
  
  // Emergency contact
  if (emergency_contact_name) payload.emergency_contact_name = sanitizeString(emergency_contact_name.trim())
  if (emergency_contact_phone) payload.emergency_contact_phone = emergency_contact_phone.trim()
  
  // Notes
  if (notes) payload.notes = notes.trim()

  // Try insert with all fields first
  let insertResult = await adminSupabase
   .from('employees')
   .insert([payload])
   .select('id')
   .single()

  // If new columns don't exist, try with basic fields only
  if (insertResult.error && insertResult.error.code === '42703') {
   console.warn('Some columns do not exist, falling back to basic insert')
   
   const basicPayload = {
    tenant_id,
    role: sanitizedRole,
    name: sanitizedName,
    full_name: sanitizedFullName,
    base_rate_sek: sanitizedBaseRate,
    email: email ? email.trim().toLowerCase() : undefined,
   }
   
   insertResult = await adminSupabase
    .from('employees')
    .insert([basicPayload])
    .select('id')
    .single()
  }

  if (insertResult.error) {
   console.error('Error creating employee:', insertResult.error)
   console.error('Payload that failed:', JSON.stringify(payload, null, 2))
   
   let errorMessage = insertResult.error.message || 'Failed to create employee'
   if (insertResult.error.message?.includes('employees_role_check')) {
    errorMessage = `Ogiltig roll-värde: "${sanitizedRole}". Tillåtna värden: 'employee', 'admin'`
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
