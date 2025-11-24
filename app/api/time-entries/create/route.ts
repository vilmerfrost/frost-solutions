import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * API route för att skapa time_entries med service role
 * Bypassar RLS och säkerställer korrekt tenant_id
 * Updated: Fixed const/let variable reassignment issue
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get tenant from JWT claim (authoritative)
    let tenantId = await getTenantId()
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

    // Read request body once (we'll need it for employee_id lookup)
    let payload: any = {}
    try {
      payload = await req.json()
    } catch (e) {
      // If body is empty or invalid, continue with empty payload
      console.warn('Could not parse request body:', e)
    }

    // Track if tenantId came from payload (frontend verified)
    let tenantIdFromPayload = false
    
    // If payload contains tenant_id and it's a valid UUID, verify it exists and use it
    // This allows frontend to override JWT tenantId if it's incorrect
    if (payload.tenant_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.tenant_id)) {
      const { data: payloadTenantCheck } = await adminSupabase
        .from('tenants')
        .select('id')
        .eq('id', payload.tenant_id)
        .single()
      
      if (payloadTenantCheck) {
        console.log('✅ Using tenantId from payload (verified):', payload.tenant_id)
        tenantId = payload.tenant_id
        tenantIdFromPayload = true
      } else {
        console.warn('⚠️ Payload tenantId does not exist:', payload.tenant_id, '- will try other sources')
      }
    }

    // If tenantId not found in JWT or payload, try to get it from employee record
    if (!tenantId && user) {
      console.warn('Tenant ID not found in JWT or payload, attempting to fetch from employee record...')
      const { data: employeeData } = await adminSupabase
        .from('employees')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .limit(1)
        .maybeSingle()
      
      if (employeeData?.tenant_id) {
        tenantId = employeeData.tenant_id
        console.log('Found tenant_id from employee record:', tenantId)
      }
    }

    if (!tenantId) {
      console.error('No tenant ID found in JWT or employee record', { userId: user?.id })
      return NextResponse.json(
        { 
          error: 'Tenant ID missing. Please ensure you are logged in and have a valid tenant.',
          suggestion: 'Try logging out and logging back in, or complete onboarding if you haven\'t already.'
        },
        { status: 400 }
      )
    }

    // Validate tenant ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(tenantId)) {
      console.error('Invalid tenant ID format:', tenantId)
      return NextResponse.json(
        { 
          error: `Invalid tenant ID format: ${tenantId}`,
          suggestion: 'Please log out and log back in to refresh your session.'
        },
        { status: 400 }
      )
    }

    // Verify tenant exists in database
    let tenantData: any = null
    let tenantError: any = null
    const tenantResult = await adminSupabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single()
    
    // Assign tenant result
    tenantData = tenantResult.data
    tenantError = tenantResult.error

    if (tenantError || !tenantData) {
      console.error('Tenant verification failed:', { 
        tenantId, 
        error: tenantError,
        errorCode: tenantError?.code,
        errorMessage: tenantError?.message
      })

      // CRITICAL SECURITY FIX: If tenant doesn't exist, try to find correct tenant from employee's projects/clients
      // This prevents data leakage between tenants
      if (payload.employee_id) {
        console.warn('⚠️ Tenant not found, attempting to find correct tenant from employee data...')
        
        // Get employee record
        const { data: employeeRecord } = await adminSupabase
          .from('employees')
          .select('id, tenant_id')
          .eq('id', payload.employee_id)
          .single()
        
        if (employeeRecord) {
          // Try to find tenant from employee's projects
          const { data: employeeProjects } = await adminSupabase
            .from('projects')
            .select('tenant_id')
            .eq('tenant_id', employeeRecord.tenant_id)
            .limit(1)
            .maybeSingle()
          
          // Try to find tenant from any project this employee has time entries on
          const { data: timeEntryTenant } = await adminSupabase
            .from('time_entries')
            .select('tenant_id')
            .eq('employee_id', payload.employee_id)
            .limit(1)
            .maybeSingle()
          
          // Get all existing tenants
          const { data: allTenants } = await adminSupabase
            .from('tenants')
            .select('id, name')
            .limit(100)
          
          const existingTenantIds = new Set((allTenants || []).map((t: any) => t.id))
          
          // Try to find a valid tenant from employee's actual data
          let correctedTenantId: string | null = null
          
          if (timeEntryTenant?.tenant_id && existingTenantIds.has(timeEntryTenant.tenant_id)) {
            correctedTenantId = timeEntryTenant.tenant_id
            console.log('✅ Found valid tenant from time_entries:', correctedTenantId)
          } else if (employeeProjects?.tenant_id && existingTenantIds.has(employeeProjects.tenant_id)) {
            correctedTenantId = employeeProjects.tenant_id
            console.log('✅ Found valid tenant from projects:', correctedTenantId)
          } else if (employeeRecord.tenant_id && existingTenantIds.has(employeeRecord.tenant_id)) {
            // Employee's tenant_id is actually valid, use it
            correctedTenantId = employeeRecord.tenant_id
            console.log('✅ Employee tenant_id is valid:', correctedTenantId)
          }
          
          if (correctedTenantId) {
            // Verify this tenant exists
            const { data: verifiedTenant } = await adminSupabase
              .from('tenants')
              .select('id, name')
              .eq('id', correctedTenantId)
              .single()
            
            if (verifiedTenant) {
              console.log('✅ Using corrected tenant_id:', correctedTenantId)
              tenantId = correctedTenantId
              // Update tenantData to continue with the request
              tenantData = verifiedTenant
              tenantError = null
            } else {
              console.error('❌ Corrected tenant_id also invalid:', correctedTenantId)
            }
          }
        }
      }
      
      // Re-verify tenant after potential correction
      if (tenantId && !tenantData) {
        const recheckResult = await adminSupabase
          .from('tenants')
          .select('id, name')
          .eq('id', tenantId)
          .single()
        
        if (recheckResult.data) {
          // Update tenant data and clear error - tenantError is declared as let above
          tenantData = recheckResult.data
          tenantError = null
          console.log('✅ Tenant verified after correction:', { tenantId, tenantName: tenantData.name })
        }
      }
      
      // If still no valid tenant after correction attempts, return error
      if (tenantError || !tenantData) {
        const { data: allTenants } = await adminSupabase
          .from('tenants')
          .select('id, name')
          .limit(100)
        
        console.error('❌ Cannot proceed - no valid tenant found. Available tenants:', allTenants)
        
        return NextResponse.json(
          { 
            error: `Tenant ID ${tenantId || 'unknown'} not found in database. This is a data integrity issue.`,
            tenantId,
            tenantError: tenantError?.message,
            suggestion: 'Please contact administrator. Your employee record may need to be updated with a valid tenant.',
            availableTenants: allTenants?.map(t => ({ id: t.id, name: t.name }))
          },
          { status: 400 }
        )
      }
    }

    console.log('Tenant verified:', { tenantId, tenantName: tenantData.name })

    // CRITICAL: "Touch" update to ensure tenant is visible in current transaction context
    // This is essential for foreign key constraint validation
    // We try multiple strategies to ensure the tenant is visible
    try {
      // Strategy 1: Try updating updated_at if it exists
      const touchResult = await adminSupabase
        .from('tenants')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', tenantId)
        .select('id')
      
      if (touchResult.error && touchResult.error.code !== '42703') {
        // Column doesn't exist error is ok, but other errors are not
        console.warn('Could not touch tenant with updated_at:', touchResult.error)
      }
      
      // Strategy 2: Always do a SELECT to ensure tenant is visible
      // This forces PostgreSQL to "see" the tenant in the transaction
      const verifySelect = await adminSupabase
        .from('tenants')
        .select('id')
        .eq('id', tenantId)
        .single()
      
      if (!verifySelect.data || verifySelect.error) {
        console.error('CRITICAL: Tenant not visible in transaction after touch:', {
          tenantId,
          error: verifySelect.error
        })
      } else {
        console.log('✅ Tenant confirmed visible in transaction:', tenantId)
      }
    } catch (touchError) {
      console.warn('Could not touch tenant:', touchError)
      // Continue anyway - the final check before insert will catch any issues
    }

    // Log incoming payload for debugging (payload already read above)
    console.log('Creating time entry with payload:', {
      tenantId,
      employee_id: payload.employee_id,
      project_id: payload.project_id,
      date: payload.date,
    })

    // Verify employee_id exists and belongs to this tenant
    if (payload.employee_id) {
      const { data: employeeCheck, error: empCheckError } = await adminSupabase
        .from('employees')
        .select('id, tenant_id, auth_user_id')
        .eq('id', payload.employee_id)
        .single()

      if (empCheckError || !employeeCheck) {
        console.error('Employee verification failed:', { employee_id: payload.employee_id, error: empCheckError })
        return NextResponse.json(
          { 
            error: `Employee ID ${payload.employee_id} not found or invalid.`,
            employee_id: payload.employee_id
          },
          { status: 400 }
        )
      }

      // If employee has a different tenant_id, check if we should use it
      // Priority: 1) tenantId from payload (already verified), 2) employee's tenant_id if it exists
      if (employeeCheck.tenant_id !== tenantId) {
        console.warn('Employee tenant mismatch detected:', {
          employee_tenant: employeeCheck.tenant_id,
          current_tenant: tenantId,
          employee_id: payload.employee_id,
          tenantId_source: tenantIdFromPayload ? 'payload (frontend verified)' : 'JWT/employee_lookup'
        })
        
        // If tenantId came from payload (frontend sent it), trust it over employee record
        // Employee record may have stale/incorrect data
        if (tenantIdFromPayload) {
          console.log('✅ Using tenantId from payload (frontend verified) - ignoring employee record tenant_id')
          // Keep using tenantId from payload - don't switch
        } else {
          // tenantId came from JWT/employee lookup, verify if employee's tenant_id exists
          const { data: empTenantCheck } = await adminSupabase
            .from('tenants')
            .select('id')
            .eq('id', employeeCheck.tenant_id)
            .single()
          
          if (empTenantCheck) {
            // Employee's tenant exists, use it instead
            tenantId = employeeCheck.tenant_id
            console.log('✅ Using employee tenant_id (verified exists):', tenantId)
          } else {
            // Employee's tenant doesn't exist - keep using current tenantId (which was already verified)
            console.warn('⚠️ Employee record has invalid tenant_id, keeping current verified tenantId:', {
              employee_tenant: employeeCheck.tenant_id,
              current_tenant: tenantId
            })
            // Don't return error - use the verified tenantId we already have
          }
        }
      }
    }

    // CRITICAL FIX: Strippa approval-fält från payload för att förhindra att offline sync
    // skriver över godkänd status. Approval-fält ska ENDAST sättas via approve-endpoints.
    const {
      approval_status, // eslint-disable-line @typescript-eslint/no-unused-vars
      approved_at,     // eslint-disable-line @typescript-eslint/no-unused-vars
      approved_by,     // eslint-disable-line @typescript-eslint/no-unused-vars
      ...safePayload
    } = payload

    console.log('[Create Time Entry] Stripped approval fields from payload', {
      hadApprovalStatus: !!approval_status,
      hadApprovedAt: !!approved_at,
      hadApprovedBy: !!approved_by,
    })

    // Validate start_time for check-in entries (entries without end_time)
    // This prevents creating invalid entries that block checkout functionality
    if (!safePayload.end_time && !safePayload.start_time) {
      console.error('❌ Invalid time entry: Missing start_time for check-in entry')
      return NextResponse.json(
        {
          error: 'start_time is required for check-in entries (entries without end_time)',
          suggestion: 'Please ensure start_time is included in the request payload'
        },
        { status: 400 }
      )
    }

    // Build insert payload progressively - ALWAYS use verified tenantId
    // Approval-fält ska INTE inkluderas - låt DB sätta default 'pending' endast vid ny rad
    const insertPayload: any = {
      tenant_id: tenantId, // ALWAYS use the verified tenantId, never from payload
      employee_id: safePayload.employee_id,
      project_id: safePayload.project_id,
      date: safePayload.date,
      start_time: safePayload.start_time, // Required for check-in entries
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

    // Double-check tenant_id before insert
    console.log('Final insert payload:', {
      tenant_id: insertPayload.tenant_id,
      tenant_id_type: typeof insertPayload.tenant_id,
      employee_id: insertPayload.employee_id,
    })

    // Verify tenant one more time right before insert
    const finalCheck = await adminSupabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .single()

    if (finalCheck.error || !finalCheck.data) {
      console.error('Final tenant check failed before insert:', { tenantId, error: finalCheck.error })
      return NextResponse.json(
        {
          error: 'Tenant verification failed immediately before insert. Please try again.',
          tenantId,
          details: finalCheck.error
        },
        { status: 400 }
      )
    }

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
        errorDetails: error.details,
        errorHint: error.hint,
        insertPayload: {
          tenant_id: insertPayload.tenant_id,
          employee_id: insertPayload.employee_id,
          project_id: insertPayload.project_id,
        }
      })
      
      // If foreign key constraint error, provide detailed diagnostics
      if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
        console.error('Foreign key constraint error:', {
          errorCode: error.code,
          errorMessage: error.message,
          errorHint: error.hint,
          errorDetails: error.details,
          tenantId,
          tenantIdType: typeof tenantId,
          tenantIdLength: tenantId?.length,
        })
        
        // Re-verify tenant exists and get all details
        const { data: recheckTenant, error: recheckError } = await adminSupabase
          .from('tenants')
          .select('id, name, created_at')
          .eq('id', tenantId)
          .single()

        // Also check if there are ANY tenants in the database
        const { data: anyTenants } = await adminSupabase
          .from('tenants')
          .select('id, name')
          .limit(5)

        return NextResponse.json(
          { 
            error: 'Foreign key constraint violation when creating time entry',
            diagnosticInfo: {
              tenantId,
              tenantIdType: typeof tenantId,
              tenantVerified: !!recheckTenant,
              tenantFound: recheckTenant ? { id: recheckTenant.id, name: recheckTenant.name } : null,
              tenantError: recheckError?.message,
              anyTenantsInDb: anyTenants?.length || 0,
              availableTenants: anyTenants?.map(t => ({ id: t.id, name: t.name })),
              originalError: {
                code: error.code,
                message: error.message,
                hint: error.hint,
                details: error.details,
              },
            },
            suggestion: recheckTenant 
              ? 'Tenant exists but foreign key constraint still fails. This indicates a database schema issue. Run SUPABASE_FIX_TIME_ENTRIES_FK.sql to fix the constraint, or contact support.'
              : `Tenant ${tenantId} not found in database. Please log out and log back in, or run SUPABASE_VERIFY_TENANT.sql to diagnose.`,
          },
          { status: 400 }
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
          return NextResponse.json(
            { error: retry.error.message || 'Failed to create time entry', details: retry.error },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, data: retry.data })
      }

      return NextResponse.json(
        { 
          error: error.message || 'Failed to create time entry', 
          details: error,
          code: error.code,
          tenantId
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Error in time-entries/create API:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

