import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

interface ProjectType {
  id: string
  name: string
  budget: number
  hours: number
}

export default async function DashboardPage() {
  const supabase = createClient()
  
  // Try to get user - check cookies first to avoid immediate redirect
  const cookieStore = await cookies()
  const hasAccessToken = cookieStore.get('sb-access-token')
  const hasRefreshToken = cookieStore.get('sb-refresh-token')
  
  // If we have tokens, try to get user (even if it fails, we might just need to refresh)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // If no user, but we have tokens, it might be a timing/refresh issue
  // Don't redirect immediately - try refreshing once
  if (!user || authError) {
    // If we have cookies, wait a moment and retry (cookies might not be synced yet)
    if (hasAccessToken || hasRefreshToken) {
      // Wait a bit for cookies to fully sync
      await new Promise(resolve => setTimeout(resolve, 200))
      const retry = await supabase.auth.getUser()
      if (!retry.data?.user) {
        // Still no user after retry - redirect to login
        redirect('/login?redirect=/dashboard')
      }
      // Success on retry - continue below
    } else {
      // No cookies at all - definitely not logged in
      redirect('/login?redirect=/dashboard')
    }
  }
  
  // If we get here, we have a user (either from first attempt or retry)
  const finalUser = user || (await supabase.auth.getUser()).data?.user
  
  if (!finalUser) {
    redirect('/login?redirect=/dashboard')
  }
  
  // Get tenant from JWT claim, cookie, or employees table
  let tenantId = await getTenantId()
  
  // If no tenant found, try to link employee by email and retry
  if (!tenantId && finalUser.email) {
    try {
      // Use relative path - works with any origin (localhost, ngrok, production)
      const linkResponse = await fetch('/api/auth/link-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUser.id,
          email: finalUser.email,
        }),
      })
      
      if (linkResponse.ok) {
        const linkData = await linkResponse.json()
        if (linkData.tenantId) {
          tenantId = linkData.tenantId
        }
      }
    } catch (err) {
      // Silent fail - continue to onboarding check
    }
  }
  
  if (!tenantId) {
    // If no tenant, redirect to onboarding so user can create one
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <p className="text-gray-600 mb-4">Ingen tenant hittad. Du behöver slutföra onboarding först.</p>
          <a 
            href="/onboarding" 
            className="inline-block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Starta onboarding
          </a>
          <div className="mt-4">
            <a href="/login" className="text-sm text-gray-500 hover:text-gray-700 underline">
              Logga in igen
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Fetch projects
  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, name, budgeted_hours')
    .eq('tenant_id', tenantId)

  // Get current user's employee ID and role FIRST (needed for filtering hours)
  const { data: employeeData } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_user_id', finalUser.id)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  
  const isAdmin = employeeData?.role === 'admin' || employeeData?.role === 'Admin' || employeeData?.role === 'ADMIN'
  const employeeId = (!isAdmin && employeeData) ? employeeData.id : null

  // Get project IDs for hours aggregation
  const projectIds = (projectRows ?? []).map((p) => p.id)
  let projectHoursMap = new Map<string, number>()
  
  if (projectIds.length > 0) {
    let hoursQuery = supabase
      .from('time_entries')
      .select('project_id, hours_total')
      .in('project_id', projectIds)
      .eq('tenant_id', tenantId)
      .eq('is_billed', false)
    
    // If not admin, only get this employee's hours
    if (!isAdmin && employeeId) {
      hoursQuery = hoursQuery.eq('employee_id', employeeId)
    }
    
    const { data: hoursData } = await hoursQuery
    
    // Aggregate hours per project
    ;(hoursData ?? []).forEach((entry) => {
      const projId = entry.project_id
      const hours = Number(entry.hours_total ?? 0)
      const current = projectHoursMap.get(projId) ?? 0
      projectHoursMap.set(projId, current + hours)
    })
  }
  
  const projects: ProjectType[] = (projectRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    budget: p.budgeted_hours ?? 0,
    hours: projectHoursMap.get(p.id) ?? 0
  }))

  // Calculate stats - get time entries for this week (unbilled only for dashboard)
  // For employees: only their own hours. For admins: all hours
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7) // Last 7 days
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0]
  
  let weekRowsQuery = supabase
    .from('time_entries')
    .select('hours_total, date')
    .gte('date', oneWeekAgoStr)
    .eq('tenant_id', tenantId)
    .eq('is_billed', false)
  
  // If not admin, only get this employee's hours
  if (!isAdmin && employeeId) {
    weekRowsQuery = weekRowsQuery.eq('employee_id', employeeId)
  }
  
  const { data: weekRows } = await weekRowsQuery

  const totalHours = (weekRows ?? []).reduce((sum, row) => sum + Number(row.hours_total ?? 0), 0)

  const { data: invoiceRows } = await supabase
    .from('invoices')
    .select('id')
    .eq('status', 'draft')
    .eq('tenant_id', tenantId)

  const stats = {
    totalHours,
    activeProjects: projects.length,
    invoicesToSend: invoiceRows?.length ?? 0
  }

  return (
    <DashboardClient
      userEmail={finalUser?.email ?? null}
      stats={stats}
      projects={projects}
    />
  )
}
