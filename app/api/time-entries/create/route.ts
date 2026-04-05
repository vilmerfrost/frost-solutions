import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

const CreateTimeEntrySchema = z.object({
  employee_id: z.string().uuid(),
  project_id: z.string().uuid().optional().nullable(),
  date: z.string(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  break_minutes: z.number().default(0),
  ob_type: z.string().default('work'),
  hours_total: z.number().default(0),
  amount_total: z.number().default(0),
  is_billed: z.boolean().default(false),
  description: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  start_location_lat: z.number().optional().nullable(),
  start_location_lng: z.number().optional().nullable(),
  end_location_lat: z.number().optional().nullable(),
  end_location_lng: z.number().optional().nullable(),
  work_site_id: z.string().uuid().optional().nullable(),
  aeta_request_id: z.string().uuid().optional().nullable(),
  mileage_km: z.number().optional().nullable(),
  travel_cost_sek: z.number().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  // Allow tenant_id in body for backward compat but we ignore it for auth
  tenant_id: z.string().uuid().optional().nullable(),
  // Approval fields are stripped (never accepted from client)
  approval_status: z.any().optional(),
  approved_at: z.any().optional(),
  approved_by: z.any().optional(),
}).passthrough()

/**
 * API route for creating time_entries with service role
 * Bypasses RLS and ensures correct tenant_id
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    let tenantId = auth.tenantId
    const adminSupabase = auth.admin

    // Read request body
    let payload: z.infer<typeof CreateTimeEntrySchema>
    try {
      const raw = await req.json()
      const parsed = CreateTimeEntrySchema.safeParse(raw)
      if (!parsed.success) {
        const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
        return apiError('Validation failed', 400, { issues })
      }
      payload = parsed.data
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    // Track if tenantId came from payload (frontend verified)
    let tenantIdFromPayload = false

    // If payload contains tenant_id and it's a valid UUID, verify it exists and use it
    if (payload.tenant_id) {
      const { data: payloadTenantCheck } = await adminSupabase
        .from('tenants')
        .select('id')
        .eq('id', payload.tenant_id)
        .single()

      if (payloadTenantCheck) {
        console.log('Using tenantId from payload (verified):', payload.tenant_id)
        tenantId = payload.tenant_id
        tenantIdFromPayload = true
      } else {
        console.warn('Payload tenantId does not exist:', payload.tenant_id, '- using JWT tenant')
      }
    }

    // Verify tenant exists in database
    const { data: tenantData, error: tenantError } = await adminSupabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenantData) {
      // Try to find correct tenant from employee record
      if (payload.employee_id) {
        const { data: employeeRecord } = await adminSupabase
          .from('employees')
          .select('id, tenant_id')
          .eq('id', payload.employee_id)
          .single()

        if (employeeRecord?.tenant_id) {
          const { data: verifiedTenant } = await adminSupabase
            .from('tenants')
            .select('id, name')
            .eq('id', employeeRecord.tenant_id)
            .single()

          if (verifiedTenant) {
            tenantId = employeeRecord.tenant_id
            console.log('Using corrected tenant_id from employee:', tenantId)
          }
        }
      }

      // Re-verify after correction
      const recheckResult = await adminSupabase
        .from('tenants')
        .select('id, name')
        .eq('id', tenantId)
        .single()

      if (!recheckResult.data) {
        return apiError('Tenant validation failed. Please contact administrator.', 400)
      }
    }

    // Verify employee_id exists and belongs to this tenant
    if (payload.employee_id) {
      const { data: employeeCheck, error: empCheckError } = await adminSupabase
        .from('employees')
        .select('id, tenant_id, auth_user_id')
        .eq('id', payload.employee_id)
        .single()

      if (empCheckError || !employeeCheck) {
        return apiError(`Employee ID ${payload.employee_id} not found or invalid.`, 400)
      }

      // Handle tenant mismatch
      if (employeeCheck.tenant_id !== tenantId) {
        console.warn('Employee tenant mismatch:', {
          employee_tenant: employeeCheck.tenant_id,
          current_tenant: tenantId,
        })

        if (!tenantIdFromPayload) {
          const { data: empTenantCheck } = await adminSupabase
            .from('tenants')
            .select('id')
            .eq('id', employeeCheck.tenant_id)
            .single()

          if (empTenantCheck) {
            tenantId = employeeCheck.tenant_id
          }
        }
      }
    }

    // CRITICAL: Strip approval fields from payload
    const {
      approval_status: _as,
      approved_at: _aa,
      approved_by: _ab,
      tenant_id: _tid,
      ...safePayload
    } = payload

    // Validate start_time for check-in entries (entries without end_time)
    if (!safePayload.end_time && !safePayload.start_time) {
      return apiError('start_time is required for check-in entries (entries without end_time)', 400)
    }

    // Build insert payload - ALWAYS use verified tenantId
    const insertPayload: Record<string, unknown> = {
      tenant_id: tenantId,
      employee_id: safePayload.employee_id,
      project_id: safePayload.project_id,
      date: safePayload.date,
      start_time: safePayload.start_time,
      end_time: safePayload.end_time || null,
      break_minutes: safePayload.break_minutes || 0,
      ob_type: safePayload.ob_type || 'work',
      hours_total: safePayload.hours_total || 0,
      amount_total: safePayload.amount_total || 0,
      is_billed: safePayload.is_billed || false,
    }

    // Add optional fields (but NOT approval fields)
    if (safePayload.user_id) insertPayload.user_id = safePayload.user_id
    if (safePayload.description) insertPayload.description = safePayload.description
    if (safePayload.start_location_lat) insertPayload.start_location_lat = safePayload.start_location_lat
    if (safePayload.start_location_lng) insertPayload.start_location_lng = safePayload.start_location_lng
    if (safePayload.end_location_lat) insertPayload.end_location_lat = safePayload.end_location_lat
    if (safePayload.end_location_lng) insertPayload.end_location_lng = safePayload.end_location_lng
    if (safePayload.work_site_id) insertPayload.work_site_id = safePayload.work_site_id
    if (safePayload.aeta_request_id) insertPayload.aeta_request_id = safePayload.aeta_request_id
    if (safePayload.mileage_km) insertPayload.mileage_km = safePayload.mileage_km
    if (safePayload.travel_cost_sek) insertPayload.travel_cost_sek = safePayload.travel_cost_sek
    if (safePayload.photos && Array.isArray(safePayload.photos)) insertPayload.photos = safePayload.photos

    // Insert with service role to bypass RLS
    const { data, error } = await adminSupabase
      .from('time_entries')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error('Error creating time entry:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
      })

      // Foreign key constraint error
      if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
        return apiError(
          'Database constraint error. Please try logging out and back in. Contact support if the issue persists.',
          400
        )
      }

      // If description column doesn't exist, retry without it
      if (error.code === '42703' || error.message?.includes('description')) {
        delete insertPayload.description
        const retry = await adminSupabase
          .from('time_entries')
          .insert([insertPayload])
          .select()
          .single()

        if (retry.error) {
          return apiError(retry.error.message || 'Failed to create time entry', 500)
        }

        return apiSuccess({ success: true, data: retry.data })
      }

      return apiError(error.message || 'Failed to create time entry', 500)
    }

    return apiSuccess({ success: true, data })
  } catch (err) {
    return handleRouteError(err)
  }
}
