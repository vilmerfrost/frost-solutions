import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'
import { getFeatureFlag } from '@/lib/featureFlags'

/**
 * GET /api/audit-logs/[table]/[recordId]
 * Hämtar audit log för specifik record
 */
export async function GET(
 req: Request,
 { params }: { params: Promise<{ table: string; recordId: string }> }
) {
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

  const { table, recordId } = await params

  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: logs, error } = await adminSupabase
   .from('audit_logs')
   .select('*')
   .eq('tenant_id', tenantId)
   .eq('table_name', table)
   .eq('record_id', recordId)
   .order('created_at', { ascending: false })

  if (error) {
   console.error('Error fetching audit logs:', error)
   return NextResponse.json(
    { error: 'Failed to fetch audit logs', details: error.message },
    { status: 500 }
   )
  }

  return NextResponse.json({
   table_name: table,
   record_id: recordId,
   logs: logs || [],
  })
 } catch (error: any) {
  console.error('Error in GET /api/audit-logs/[table]/[recordId]:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

