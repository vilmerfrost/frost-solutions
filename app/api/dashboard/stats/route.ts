import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
 try {
  const supabase = createServerClient()
  const {
   data: { user },
   error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ success: false, error: 'No tenant found' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Determine role for current user within tenant
  const { data: employeeRecord } = await admin
   .from('employees')
   .select('id, role')
   .eq('tenant_id', tenantId)
   .eq('auth_user_id', user.id)
   .maybeSingle()

  const employeeId = employeeRecord?.id ?? null
  const role = employeeRecord?.role?.toLowerCase?.() ?? null
  const isAdmin = role === 'admin' || role === 'super_admin' || role === 'manager'

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const oneWeekAgoStr = oneWeekAgo.toISOString().slice(0, 10)

  // Build time entries query (scoped to employee if not admin)
  let timeEntriesQuery = admin
   .from('time_entries')
   .select('hours_total, hours, employee_id')
   .eq('tenant_id', tenantId)
   .eq('is_billed', false)
   .gte('date', oneWeekAgoStr)

  if (!isAdmin && employeeId) {
   timeEntriesQuery = timeEntriesQuery.eq('employee_id', employeeId)
  }

  // Run all 3 queries in parallel
  const [
   { data: timeEntries, error: timeError },
   { data: projectsData, error: projectsError },
   { data: invoiceRows, error: invoiceError },
  ] = await Promise.all([
   timeEntriesQuery,
   admin.from('projects').select('id, status').eq('tenant_id', tenantId),
   admin.from('invoices').select('id').eq('tenant_id', tenantId).eq('status', 'draft'),
  ])

  if (timeError) console.error('Dashboard stats: error fetching time entries', timeError)
  if (projectsError) console.error('Dashboard stats: error fetching projects', projectsError)
  if (invoiceError) console.error('Dashboard stats: error fetching invoices', invoiceError)

  const totalHours = (timeEntries ?? []).reduce(
   (sum, entry) => {
    const seconds = Number(entry.hours_total ?? entry.hours ?? 0)
    return sum + (seconds / 3600.0)
   },
   0,
  )

  const activeProjects = (projectsData ?? []).filter((project) => {
   const status = (project as any).status || null
   return status !== 'completed' && status !== 'archived'
  }).length

  return NextResponse.json({
   success: true,
   data: {
    totalHours,
    activeProjects,
    invoicesToSend: invoiceRows?.length ?? 0,
   },
  })
 } catch (error: any) {
  console.error('Unexpected dashboard stats error:', error)
  return NextResponse.json({ success: false, error: error.message || 'Dashboard stats failed' }, { status: 500 })
 }
}


