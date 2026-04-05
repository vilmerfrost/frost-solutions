import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { checkRateLimit, getClientIP, sanitizeString } from '@/lib/security'

const CreateEmployeeSchema = z.object({
  tenant_id: z.string().uuid('tenant_id must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  full_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email('Giltig e-postadress krävs'),
  role: z.enum(['employee', 'admin']).default('employee'),
  base_rate_sek: z.number().min(0).max(1000000).default(360),
  default_rate_sek: z.number().min(0).max(1000000).optional(),
  phone: z.string().optional(),
  personal_id: z.string().optional(),
  employment_type: z.string().optional(),
  job_role: z.string().optional(),
  start_date: z.string().optional(),
  has_drivers_license: z.boolean().optional(),
  is_over_19: z.boolean().optional(),
  has_safety_training: z.boolean().optional(),
  has_rot_eligibility: z.boolean().optional(),
  has_electrical_cert: z.boolean().optional(),
  has_fall_protection: z.boolean().optional(),
  monthly_salary_gross: z.number().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * API route for creating employees with service role
 * Handles all fields for enhanced employee system
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting - max 10 employee creations per IP per hour
    const clientIP = getClientIP(req as unknown as Request)
    const rateLimit = checkRateLimit(`employee_create:${clientIP}`, 10, 60 * 60 * 1000)

    if (!rateLimit.allowed) {
      return apiError(
        'For manga forfragningar. Forsok igen om ' + rateLimit.retryAfter + ' sekunder.',
        429,
        { retryAfter: rateLimit.retryAfter }
      )
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    // Check admin status
    const { data: employeeData } = await auth.admin
      .from('employees')
      .select('id, role, tenant_id')
      .eq('auth_user_id', auth.user.id)
      .limit(10)

    let isAdmin = false
    if (employeeData && Array.isArray(employeeData)) {
      isAdmin = employeeData.some(e => ['admin', 'Admin', 'ADMIN'].includes(e.role))
    }

    // Fallback: Try by email
    if (!isAdmin && auth.user.email) {
      const { data: emailEmployeeList } = await auth.admin
        .from('employees')
        .select('id, role, tenant_id')
        .eq('email', auth.user.email)
        .limit(10)

      if (emailEmployeeList && Array.isArray(emailEmployeeList)) {
        isAdmin = emailEmployeeList.some(e => ['admin', 'Admin', 'ADMIN'].includes(e.role))
      }
    }

    if (!isAdmin) {
      return apiError('Admin access required', 403)
    }

    const body = await parseBody(req, CreateEmployeeSchema)
    if (body.error) return body.error

    const {
      tenant_id, name, full_name, first_name, last_name, email, role,
      base_rate_sek, phone, personal_id, employment_type, job_role,
      start_date, has_drivers_license, is_over_19, has_safety_training,
      has_rot_eligibility, has_electrical_cert, has_fall_protection,
      monthly_salary_gross, emergency_contact_name, emergency_contact_phone,
      notes,
    } = body.data

    // Sanitize inputs
    const sanitizedName = sanitizeString(name.trim())
    const sanitizedFullName = full_name ? sanitizeString(full_name.trim()) : sanitizedName

    // Build payload with all fields
    const payload: Record<string, unknown> = {
      tenant_id,
      role,
      name: sanitizedName,
      full_name: sanitizedFullName,
      base_rate_sek,
      email: email.trim().toLowerCase(),
    }

    // Add optional fields
    if (first_name) payload.first_name = sanitizeString(first_name.trim())
    if (last_name) payload.last_name = sanitizeString(last_name.trim())
    if (phone) payload.phone = phone.trim()
    if (personal_id) payload.personal_id = personal_id.trim()
    if (employment_type) payload.employment_type = employment_type
    if (job_role) payload.job_role = job_role
    if (start_date) payload.start_date = start_date

    // Competencies (booleans)
    if (has_drivers_license !== undefined) payload.has_drivers_license = has_drivers_license
    if (is_over_19 !== undefined) payload.is_over_19 = is_over_19
    if (has_safety_training !== undefined) payload.has_safety_training = has_safety_training
    if (has_rot_eligibility !== undefined) payload.has_rot_eligibility = has_rot_eligibility
    if (has_electrical_cert !== undefined) payload.has_electrical_cert = has_electrical_cert
    if (has_fall_protection !== undefined) payload.has_fall_protection = has_fall_protection

    // Salary
    if (monthly_salary_gross) payload.monthly_salary_gross = monthly_salary_gross

    // Emergency contact
    if (emergency_contact_name) payload.emergency_contact_name = sanitizeString(emergency_contact_name.trim())
    if (emergency_contact_phone) payload.emergency_contact_phone = emergency_contact_phone.trim()

    // Notes
    if (notes) payload.notes = notes.trim()

    // Try insert with all fields first
    let insertResult = await auth.admin
      .from('employees')
      .insert([payload])
      .select('id')
      .single()

    // If new columns don't exist, try with basic fields only
    if (insertResult.error && insertResult.error.code === '42703') {
      console.warn('Some columns do not exist, falling back to basic insert')

      const basicPayload = {
        tenant_id,
        role,
        name: sanitizedName,
        full_name: sanitizedFullName,
        base_rate_sek,
        email: email.trim().toLowerCase(),
      }

      insertResult = await auth.admin
        .from('employees')
        .insert([basicPayload])
        .select('id')
        .single()
    }

    if (insertResult.error) {
      console.error('Error creating employee:', insertResult.error)

      let errorMessage = insertResult.error.message || 'Failed to create employee'
      if (insertResult.error.message?.includes('employees_role_check')) {
        errorMessage = `Invalid role value: "${role}". Allowed: 'employee', 'admin'`
      }

      return apiError(errorMessage, 500)
    }

    // Send Supabase magic link invite to the worker
    let inviteSent = false
    const normalizedEmail = email.trim().toLowerCase()
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/app'
      const redirectTo = `${appUrl}/auth/callback`

      const { error: inviteError } = await auth.admin.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
      })

      if (inviteError) {
        console.warn('Failed to send invite (employee still created):', inviteError.message)
      } else {
        inviteSent = true
      }
    } catch (inviteErr) {
      console.warn('Invite send threw (employee still created):', inviteErr)
    }

    return apiSuccess({ employee: insertResult.data, invite_sent: inviteSent })
  } catch (err) {
    return handleRouteError(err)
  }
}
