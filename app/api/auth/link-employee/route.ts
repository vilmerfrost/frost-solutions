import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP, isValidUUID, isValidEmail } from '@/lib/security'

/**
 * API route för att automatiskt länka employee-record till auth_user_id
 * Används när en användare loggar in och det finns en employee-record med samma email
 * men utan auth_user_id kopplad
 * 
 * SECURITY:
 * - Requires authentication
 * - Rate limited to prevent abuse
 * - Only allows linking for the authenticated user
 */
export async function POST(req: Request) {
 try {
  // SECURITY: Rate limiting - max 10 link attempts per IP per hour
  const clientIP = getClientIP(req)
  const rateLimitResult = checkRateLimit(`link-employee:${clientIP}`, 10, 60 * 60 * 1000)
  if (!rateLimitResult.allowed) {
   return NextResponse.json(
    { error: 'För många förfrågningar. Försök igen senare.' },
    { 
     status: 429,
     headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
    }
   )
  }

  // SECURITY: Verify authentication
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json(
    { error: 'Not authenticated' },
    { status: 401 }
   )
  }

  const { userId, email } = await req.json()

  if (!userId || !email) {
   return NextResponse.json(
    { error: 'userId and email are required' },
    { status: 400 }
   )
  }

  // SECURITY: Validate input formats
  if (!isValidUUID(userId)) {
   return NextResponse.json(
    { error: 'Invalid userId format' },
    { status: 400 }
   )
  }

  if (!isValidEmail(email)) {
   return NextResponse.json(
    { error: 'Invalid email format' },
    { status: 400 }
   )
  }

  // SECURITY: Only allow linking for the authenticated user
  if (user.id !== userId) {
   console.warn('SECURITY: Attempt to link employee for different user', {
    authenticatedUser: user.id,
    requestedUserId: userId,
    ip: clientIP
   })
   return NextResponse.json(
    { error: 'Cannot link employee for another user' },
    { status: 403 }
   )
  }

  // SECURITY: Verify email matches the authenticated user's email
  if (user.email?.toLowerCase() !== email.toLowerCase()) {
   console.warn('SECURITY: Email mismatch in link-employee', {
    userEmail: user.email,
    requestedEmail: email,
    ip: clientIP
   })
   return NextResponse.json(
    { error: 'Email does not match authenticated user' },
    { status: 403 }
   )
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Find employee records with this email but no auth_user_id (or different auth_user_id)
  const { data: employeesByEmail, error: findError } = await adminSupabase
   .from('employees')
   .select('id, auth_user_id, tenant_id, email')
   .eq('email', email.toLowerCase())
   .limit(10)

  if (findError) {
   console.error('Error finding employees by email:', findError)
   return NextResponse.json(
    { error: findError.message },
    { status: 500 }
   )
  }

  if (!employeesByEmail || employeesByEmail.length === 0) {
   // No employee record found - that's okay, user might need to complete onboarding
   return NextResponse.json({
    linked: false,
    message: 'No employee record found with this email',
   })
  }

  // Find employee without auth_user_id or with different auth_user_id
  const employeeToLink = employeesByEmail.find(
   (emp: any) => !emp.auth_user_id || emp.auth_user_id !== userId
  )

  if (!employeeToLink) {
   // Employee already linked or no employee needs linking
   return NextResponse.json({
    linked: false,
    message: 'Employee record already linked or no update needed',
    employeeId: employeesByEmail[0]?.id,
    tenantId: employeesByEmail[0]?.tenant_id,
   })
  }

  // Update employee record to link auth_user_id
  const { data: updatedEmployee, error: updateError } = await adminSupabase
   .from('employees')
   .update({ auth_user_id: userId })
   .eq('id', employeeToLink.id)
   .select('id, tenant_id, auth_user_id')
   .single()

  if (updateError) {
   console.error('Error updating employee auth_user_id:', updateError)
   return NextResponse.json(
    { error: updateError.message },
    { status: 500 }
   )
  }

  console.log('Successfully linked employee to auth_user_id:', {
   employeeId: updatedEmployee.id,
   tenantId: updatedEmployee.tenant_id,
   authUserId: updatedEmployee.auth_user_id,
  })

  return NextResponse.json({
   linked: true,
   employeeId: updatedEmployee.id,
   tenantId: updatedEmployee.tenant_id,
   message: 'Employee record linked successfully',
  })
 } catch (err: any) {
  console.error('Error in link-employee API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

