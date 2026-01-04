import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'
import { getFeatureFlag } from '@/lib/featureFlags'

/**
 * GET /api/audit-logs/search
 * Söker i audit logs
 */
export async function GET(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  // Kontrollera feature flag
  const auditEnabled = await getFeatureFlag(tenantId, 'enable_audit_log')
  if (!auditEnabled) {
   return NextResponse.json(
    { error: 'Audit log is not enabled for this tenant' },
    { status: 403 }
   )
  }

  const { searchParams } = new URL(req.url)
  const tableName = searchParams.get('table_name')
  const recordId = searchParams.get('record_id')
  const action = searchParams.get('action')
  const employeeId = searchParams.get('employee_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Kontrollera admin-access för vissa queries
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .single()

  const isAdmin = employeeData?.role === 'admin'

  // Bygg query
  let query = adminSupabase
   .from('audit_logs')
   .select('*', { count: 'exact' })
   .eq('tenant_id', tenantId)

  if (tableName) {
   query = query.eq('table_name', tableName)
  }

  if (recordId) {
   query = query.eq('record_id', recordId)
  }

  if (action) {
   query = query.eq('action', action)
  }

  if (employeeId) {
   // Bara admins kan söka på andra employees
   if (!isAdmin) {
    return NextResponse.json(
     { error: 'Admin access required to search by employee_id' },
     { status: 403 }
    )
   }
   query = query.eq('employee_id', employeeId)
  } else if (!isAdmin) {
   // Non-admins ser bara sina egna logs
   query = query.eq('employee_id', employeeData?.id)
  }

  if (startDate) {
   query = query.gte('created_at', startDate)
  }

  if (endDate) {
   query = query.lte('created_at', endDate)
  }

  query = query
   .order('created_at', { ascending: false })
   .range(offset, offset + limit - 1)

  const { data: logs, error, count } = await query

  if (error) {
   console.error('Error searching audit logs:', error)
   return NextResponse.json(
    { error: 'Failed to search audit logs', details: error.message },
    { status: 500 }
   )
  }

  return NextResponse.json({
   logs: logs || [],
   total: count || 0,
   limit,
   offset,
  })
 } catch (error: any) {
  console.error('Error in GET /api/audit-logs/search:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

