import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const num = (value: unknown) => Number(value ?? 0)
const dateOnly = (date: Date) => date.toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
 try {
  const tenantId = await getTenantId()

  if (!tenantId) {
   return NextResponse.json({ success: false, error: 'Ingen tenant' }, { status: 401 })
  }

  const url = new URL(req.url)
  const period = url.searchParams.get('period') || 'month'

  const now = new Date()
  const startDate = new Date(now)
  if (period === 'week') {
   startDate.setDate(now.getDate() - 7)
  } else if (period === 'month') {
   startDate.setMonth(now.getMonth() - 1)
  } else if (period === 'year') {
   startDate.setFullYear(now.getFullYear() - 1)
  }
  startDate.setUTCHours(0, 0, 0, 0)

  const endDate = new Date(now)
  endDate.setUTCHours(23, 59, 59, 999)

  const admin = createAdminClient(8000, 'public')

  // Logga input för debugging
  const startDateStr = dateOnly(startDate)
  const endDateStr = dateOnly(endDate)

  if (process.env.NODE_ENV !== 'production') {
   console.log('📊 [Analytics API] Calling RPC:', {
    tenantId,
    startDate: startDateStr,
    endDate: endDateStr,
    period,
   })
  }

  // Test: Hämta rådata först för debugging
  const { data: rawData, error: rawError } = await admin
   .from('time_entries')
   .select('id, hours_total, date, project_id')
   .eq('tenant_id', tenantId)
   .gte('date', startDateStr)
   .lte('date', endDateStr)

  if (process.env.NODE_ENV !== 'production') {
   console.log('🔍 [Analytics API] Raw data check:', {
    count: rawData?.length || 0,
    totalSeconds: rawData?.reduce((sum, item) => sum + (item.hours_total || 0), 0) || 0,
    totalHours: (rawData?.reduce((sum, item) => sum + (item.hours_total || 0), 0) || 0) / 3600,
    error: rawError,
   })
  }

  // RPC call med DATE-parametrar (inte timestamptz)
  const { data: analytics, error: analyticsError } = await admin.rpc(
   'get_tenant_dashboard_analytics',
   {
    p_tenant_id: tenantId,
    p_start_date: startDateStr, // YYYY-MM-DD format
    p_end_date: endDateStr, // YYYY-MM-DD format
   },
  )

  if (analyticsError) {
   console.error('❌ [Analytics API] RPC Error:', analyticsError)
   return NextResponse.json(
    { success: false, error: 'Analytics failed', details: analyticsError.message },
    { status: 500 },
   )
  }

  const analyticsRow = Array.isArray(analytics) ? analytics[0] : analytics

  if (process.env.NODE_ENV !== 'production') {
   console.log('✅ [Analytics API] RPC Success:', {
    total_hours: analyticsRow?.total_hours,
    active_projects: analyticsRow?.active_projects,
    total_entries: analyticsRow?.total_entries,
    raw: analyticsRow,
   })
  }

  if (!analyticsRow) {
   console.warn('⚠️ [Analytics API] RPC returned empty result')
  }

  const [projectsResult, invoicesResult, employeesResult, timeEntriesResult] = await Promise.all([
   admin
    .from('projects')
    .select('id, status, budgeted_hours, base_rate_sek')
    .eq('tenant_id', tenantId),
   admin
    .from('invoices')
    .select('amount, status, issue_date')
    .eq('tenant_id', tenantId)
    .gte('issue_date', dateOnly(startDate)),
   admin
    .from('employees')
    .select('id')
    .eq('tenant_id', tenantId),
   admin
    .from('time_entries')
    .select('project_id, hours_total, hours, is_billed')
    .eq('tenant_id', tenantId)
    .gte('date', dateOnly(startDate)),
  ])

  const projects = projectsResult.data ?? []
  const invoices = invoicesResult.data ?? []
  const employees = employeesResult.data ?? []
  const timeEntries = timeEntriesResult.data ?? []

  const projectHoursMap = new Map<string, number>()
  for (const entry of timeEntries) {
   const projectId = (entry as any)?.project_id
   if (!projectId) continue
   const total = projectHoursMap.get(projectId) ?? 0
   projectHoursMap.set(projectId, total + num((entry as any).hours_total ?? (entry as any).hours))
  }

  const activeProjects = projects.filter((project) => project.status === 'active')
  const totalBudgetedHours = projects.reduce((sum, project) => sum + num(project.budgeted_hours), 0)

  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid')
  const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + num(invoice.amount), 0)

  const outstandingInvoices = invoices.filter((invoice) =>
   ['sent', 'draft'].includes(invoice.status ?? ''),
  )
  const unpaidAmount = outstandingInvoices.reduce((sum, invoice) => sum + num(invoice.amount), 0)

  const budgetVariance = totalBudgetedHours > 0
   ? ((num(analyticsRow?.total_hours) / totalBudgetedHours) - 1) * 100
   : 0

  const unbilledHours = timeEntries
   .filter((entry) => !entry?.is_billed)
   .reduce((sum, entry) => sum + num(entry.hours_total ?? entry.hours), 0)

  const responseData = {
   summary: {
    activeProjects: activeProjects.length,
    totalEmployees: employees.length,
    totalHours: Math.round(num(analyticsRow?.total_hours) * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    unpaidInvoices: outstandingInvoices.length,
    unpaidAmount: Math.round(unpaidAmount * 100) / 100,
   },
   kpis: {
    budgetVariance: Math.round(budgetVariance * 100) / 100,
    utilization: totalBudgetedHours > 0
     ? Math.round((num(analyticsRow?.total_hours) / totalBudgetedHours) * 100) / 100
     : 0,
    unbilledHours: Math.round(unbilledHours * 100) / 100,
   },
   projectPerformance: projects.slice(0, 10).map((project) => {
    const actualHours = projectHoursMap.get(project.id) ?? 0
    const plannedHours = num(project.budgeted_hours)
    const spi = plannedHours > 0 ? actualHours / plannedHours : 0
    return {
     projectId: project.id,
     name: project.name ?? 'Okänt projekt',
     status: project.status ?? 'active',
     spi: Math.round(spi * 100) / 100,
    }
   }),
   period,
  }

  return NextResponse.json({ success: true, data: responseData })
 } catch (error: any) {
  console.error('Analytics error:', error)
  return NextResponse.json(
   { success: false, error: error.message ?? 'Analytics failed' },
   { status: 500 },
  )
 }
}

