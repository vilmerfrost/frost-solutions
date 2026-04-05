import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { checkRateLimit, getClientIP, sanitizeString, isValidEmail, isValidUUID } from '@/lib/security'

const UpdateEmployeeSchema = z.object({
  name: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().email().optional().nullable(),
  role: z.string().optional(),
  base_rate_sek: z.number().min(0).max(1000000).optional(),
  default_rate_sek: z.number().min(0).max(1000000).optional(),
})

/**
 * API route for updating employees (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Rate limiting
    const clientIP = getClientIP(req as unknown as Request)
    const rateLimit = checkRateLimit(`employee_update:${clientIP}`, 20, 60 * 60 * 1000)

    if (!rateLimit.allowed) {
      return apiError(
        'For manga forfragningar. Forsok igen om ' + rateLimit.retryAfter + ' sekunder.',
        429,
        { retryAfter: rateLimit.retryAfter }
      )
    }

    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    // Check admin status - must be admin in the same tenant
    const { data: employeeData } = await auth.admin
      .from('employees')
      .select('id, role, tenant_id')
      .eq('auth_user_id', auth.user.id)
      .eq('tenant_id', auth.tenantId)
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
        .eq('tenant_id', auth.tenantId)
        .limit(10)

      if (emailEmployeeList && Array.isArray(emailEmployeeList)) {
        isAdmin = emailEmployeeList.some(e => ['admin', 'Admin', 'ADMIN'].includes(e.role))
      }
    }

    if (!isAdmin) {
      return apiError('Admin access required', 403)
    }

    // Verify that the employee being updated belongs to the same tenant
    const { data: targetEmployee } = await auth.admin
      .from('employees')
      .select('id, tenant_id')
      .eq('id', id)
      .single()

    if (!targetEmployee) {
      return apiError('Employee not found', 404)
    }

    if (targetEmployee.tenant_id !== auth.tenantId) {
      return apiError('Access denied: Employee belongs to different tenant', 403)
    }

    const body = await parseBody(req, UpdateEmployeeSchema)
    if (body.error) return body.error

    // Input validation
    if (!isValidUUID(id)) {
      return apiError('Invalid employee ID', 400)
    }

    const { name, full_name, email, role, base_rate_sek, default_rate_sek } = body.data

    // Build update payload
    const updatePayload: Record<string, unknown> = {}

    if (name) {
      updatePayload.name = sanitizeString(name.trim())
    }

    if (full_name) {
      updatePayload.full_name = sanitizeString(full_name.trim())
    }

    if (email !== undefined) {
      if (email && !isValidEmail(email)) {
        return apiError('Invalid email address', 400)
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

    if (base_rate_sek !== undefined) {
      updatePayload.base_rate_sek = base_rate_sek
    }

    if (default_rate_sek !== undefined) {
      updatePayload.default_rate_sek = default_rate_sek
    }

    // Update employee - try with all fields first
    let updateResult = await auth.admin
      .from('employees')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select('id')
      .single()

    // Fallback: try without default_rate_sek if column doesn't exist
    if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('default_rate_sek'))) {
      const { default_rate_sek: _, ...payloadWithoutDefaultRate } = updatePayload
      updateResult = await auth.admin
        .from('employees')
        .update(payloadWithoutDefaultRate)
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
        .select('id')
        .single()
    }

    // Fallback: try without base_rate_sek if column doesn't exist
    if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('base_rate_sek'))) {
      const { base_rate_sek: _, ...payloadWithoutBaseRate } = updatePayload
      updateResult = await auth.admin
        .from('employees')
        .update(payloadWithoutBaseRate)
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
        .select('id')
        .single()
    }

    // Fallback: try without both rate fields
    if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('rate'))) {
      const { base_rate_sek: _, default_rate_sek: __, ...payloadWithoutRates } = updatePayload
      updateResult = await auth.admin
        .from('employees')
        .update(payloadWithoutRates)
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
        .select('id')
        .single()
    }

    if (updateResult.error) {
      console.error('Error updating employee:', updateResult.error)
      return apiError(updateResult.error.message || 'Failed to update employee', 500)
    }

    return apiSuccess({ employee: updateResult.data })
  } catch (err) {
    return handleRouteError(err)
  }
}
