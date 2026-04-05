import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'

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
     <Link 
      href="/onboarding" 
      className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
     >
      Starta onboarding
     </Link>
     <div className="mt-4">
      <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 underline">
       Logga in igen
      </Link>
     </div>
    </div>
   </div>
  )
 }

 // Get current user's employee ID and role (needed for filtering hours)
 const { data: employeeData } = await supabase
  .from('employees')
  .select('id, role')
  .eq('auth_user_id', finalUser.id)
  .eq('tenant_id', tenantId)
  .maybeSingle()

 const isAdmin = employeeData?.role === 'admin' || employeeData?.role === 'Admin' || employeeData?.role === 'ADMIN'
 const employeeId = (!isAdmin && employeeData) ? employeeData.id : null

 // Get active projects count
 const { count: activeProjectsCount } = await supabase
  .from('projects')
  .select('id', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)

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
  activeProjects: activeProjectsCount ?? 0,
  invoicesToSend: invoiceRows?.length ?? 0
 }

 return (
  <DashboardClient
   userEmail={finalUser?.email ?? null}
   stats={stats}
  />
 )
}
