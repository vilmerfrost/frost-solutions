'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import Sidebar from '@/components/Sidebar'
import TimeClock from '@/components/TimeClock'
import NotificationCenter from '@/components/NotificationCenter'
import { WeeklySchedules } from '@/components/dashboard/WeeklySchedulesComponent'
import InvoiceList from '@/components/invoice-list'

interface ProjectType {
 id: string
 name: string
 budgeted_hours?: number
 base_rate_sek?: number
}

interface DashboardClientProps {
 userEmail: string | null
 stats: {
  totalHours: number
  activeProjects: number
  invoicesToSend: number
 }
 projects: ProjectType[]
}

export default function DashboardClient({ userEmail, stats, projects: initialProjects }: DashboardClientProps) {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [employeeId, setEmployeeId] = useState<string | null>(null)
 const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; name: string }>>([])
 const [timeClockTenantId, setTimeClockTenantId] = useState<string | null>(null)
 const [dashboardProjects, setDashboardProjects] = useState<ProjectType[]>([])
 const [dashboardStats, setDashboardStats] = useState(stats)
 const [projectsLoaded, setProjectsLoaded] = useState(false)
 const [statsLoaded, setStatsLoaded] = useState(false)

 // Get current user's employee ID and projects for time clock
 useEffect(() => {
  async function fetchTimeClockData() {
   // Don't log warnings during initial mount - wait for TenantContext to hydrate
   if (!tenantId) {
    return
   }

   try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
     console.log('TimeClock: No user')
     return
    }

    console.log('TimeClock: Fetching employee for user', user.id)

    // Use API route that handles RLS and service role fallback
    let foundEmployeeId: string | null = null
    
    try {
     const employeeData = await apiFetch<{ employeeId?: string; error?: string; suggestion?: string }>('/api/employee/get-current')
     if (employeeData.employeeId) {
      console.log('TimeClock: Found employee ID via API:', employeeData.employeeId)
      foundEmployeeId = employeeData.employeeId
     } else {
      console.warn('TimeClock: No employee found via API:', employeeData.error || employeeData.suggestion)
     }
    } catch (err) {
     console.error('TimeClock: API error:', err)
    }

    // Fallback: Try direct query if API didn't find employee
    if (!foundEmployeeId) {
     console.log('TimeClock: Trying direct query as fallback')
     const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

     if (employeeError) {
      console.warn('TimeClock: Direct query error:', employeeError)
     } else if (employeeData) {
      // Type guard to ensure employeeData has id property
      const employee = employeeData as { id: string } | null
      if (employee?.id) {
       console.log('TimeClock: Found employee ID via direct query:', employee.id)
       foundEmployeeId = employee.id
      }
     }
    }

    if (foundEmployeeId) {
     setEmployeeId(foundEmployeeId)
    }

    // CRITICAL SECURITY: Always use tenantId from centralized API (same as TenantContext)
    // This ensures consistency across all components
    let projectsTenantId = tenantId
    
    // Validate tenantId format (UUID) and get from centralized API if needed
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    // Always get tenantId from centralized API for consistency
    if (!projectsTenantId || !uuidRegex.test(projectsTenantId)) {
     console.warn('⚠️ Dashboard: Invalid or missing tenantId in context, fetching from centralized API...')
     try {
      const tenantData = await apiFetch<{ tenantId?: string }>('/api/tenant/get-tenant', { cache: 'no-store' })
      if (tenantData.tenantId && uuidRegex.test(tenantData.tenantId)) {
       projectsTenantId = tenantData.tenantId
       console.log('✅ Dashboard: Got tenantId from centralized API:', projectsTenantId)
      }
     } catch (err) {
      console.error('Dashboard: Failed to get tenant from API:', err)
     }
    } else {
     // Verify tenant exists (only if format is valid)
     try {
      const { data: tenantVerify } = await supabase
       .from('tenants')
       .select('id')
       .eq('id', projectsTenantId)
       .maybeSingle()
      
      if (!tenantVerify) {
       console.warn('⚠️ Dashboard: Context tenantId not found in database, fetching from centralized API')
       try {
        const tenantData = await apiFetch<{ tenantId?: string }>('/api/tenant/get-tenant', { cache: 'no-store' })
        if (tenantData.tenantId && uuidRegex.test(tenantData.tenantId)) {
         projectsTenantId = tenantData.tenantId
         console.log('✅ Dashboard: Got tenantId from centralized API:', projectsTenantId)
        }
       } catch (err) {
        console.error('Dashboard: Failed to get tenant from API:', err)
       }
      } else {
       console.log('✅ Dashboard: Using tenantId from context (verified):', projectsTenantId)
      }
     } catch (verifyErr) {
      console.error('❌ Dashboard: Error verifying tenant:', verifyErr)
      // Fallback to centralized API
      try {
       const tenantData = await apiFetch<{ tenantId?: string }>('/api/tenant/get-tenant', { cache: 'no-store' })
       if (tenantData.tenantId && uuidRegex.test(tenantData.tenantId)) {
        projectsTenantId = tenantData.tenantId
        console.log('✅ Dashboard: Got tenantId from centralized API (after error):', projectsTenantId)
       }
      } catch (err) {
       console.error('Dashboard: Failed to get tenant from API:', err)
      }
     }
    }
    
    if (!projectsTenantId) {
     console.error('❌ Dashboard: CRITICAL - No valid tenantId available - cannot fetch projects safely!')
     return
    }
    
    console.log('🔒 Dashboard: Using tenantId:', projectsTenantId, 'for projects and TimeClock')
    
    // Store the correct tenantId for TimeClock
    setTimeClockTenantId(projectsTenantId)
    
    // Fetch projects using API route (bypasses RLS)
    try {
     const projectsData = await apiFetch<{ projects?: Array<{ id: string; name: string }>; tenantId?: string }>('/api/projects/for-timeclock', { cache: 'no-store' })
     if (projectsData.projects && projectsData.projects.length > 0) {
      console.log('✅ TimeClock: Found projects via API', projectsData.projects.length, 'for tenant', projectsData.tenantId || projectsTenantId)
      setAvailableProjects(projectsData.projects)
     } else {
      console.warn('⚠️ TimeClock: API returned no projects for tenant', projectsData.tenantId || projectsTenantId)
      setAvailableProjects([])
     }
    } catch (apiError) {
      // Fallback: Try direct query
      console.warn('⚠️ Projects API failed, trying direct query...')
      let projectsData: any[] | null = null
      let projError: any = null
      
      // Try with status filter first
      let { data, error } = await supabase
       .from('projects')
       .select('id, name')
       .eq('tenant_id', projectsTenantId)
       .neq('status', 'completed')
       .neq('status', 'archived')
       .order('name', { ascending: true })
      
      if (error) {
       // If status column doesn't exist, try without status filter
       if (error.code === '42703' || error.message?.includes('status')) {
        console.warn('Status column not found, fetching all projects for tenant')
        const fallback = await supabase
         .from('projects')
         .select('id, name')
         .eq('tenant_id', projectsTenantId)
         .order('name', { ascending: true })
        
        projectsData = fallback.data
        projError = fallback.error
       } else {
        projectsData = data
        projError = error
       }
      } else {
       projectsData = data
      }

      if (projectsData && projectsData.length > 0) {
       console.log('✅ TimeClock: Found projects via direct query', projectsData.length)
       setAvailableProjects(projectsData)
      } else {
       console.warn('⚠️ TimeClock: No projects found via direct query for tenant', projectsTenantId)
       if (projError) {
        console.error('Project fetch error:', projError)
       }
       setAvailableProjects([])
      }
    }
   } catch (err) {
    console.error('TimeClock: Error fetching time clock data:', err)
   }
  }

  fetchTimeClockData()
 }, [tenantId])

 // Separate function to fetch and update stats (can be called independently)
 const fetchDashboardStats = async (tenantIdParam: string) => {
  const cacheKey = `dashboard-stats:${tenantIdParam}`
  try {
   if (typeof window !== 'undefined' && !navigator.onLine) {
    const cached = window.localStorage.getItem(cacheKey)
    if (cached) {
     try {
      const parsed = JSON.parse(cached)
      setDashboardStats(parsed)
      setStatsLoaded(true)
      return
     } catch (parseErr) {
      console.warn('⚠️ Failed to parse cached dashboard stats', parseErr)
     }
    }
   }

   const result = await apiFetch<{ success?: boolean; data?: { totalHours?: number; activeProjects?: number; invoicesToSend?: number }; error?: string }>('/api/dashboard/stats', { cache: 'no-store' })
   
   if (!result.success || !result.data) {
    throw new Error(result.error || 'Invalid dashboard stats response')
   }

   setDashboardStats({
    totalHours: Number(result.data.totalHours ?? 0),
    activeProjects: Number(result.data.activeProjects ?? 0),
    invoicesToSend: Number(result.data.invoicesToSend ?? 0),
   })

   if (typeof window !== 'undefined') {
    try {
     window.localStorage.setItem(cacheKey, JSON.stringify({
      totalHours: Number(result.data.totalHours ?? 0),
      activeProjects: Number(result.data.activeProjects ?? 0),
      invoicesToSend: Number(result.data.invoicesToSend ?? 0),
     }))
    } catch (cacheErr) {
     console.warn('⚠️ Failed to cache dashboard stats', cacheErr)
    }
   }

   setStatsLoaded(true)
  } catch (err) {
   console.error('Error fetching dashboard stats:', err)
   setStatsLoaded(true)
  }
 }

 // Fetch dashboard projects and stats client-side so they update when new projects are created
 useEffect(() => {
  if (!tenantId) return

  let cancelled = false

  async function fetchDashboardProjects() {
   if (cancelled) return

   try {
    // Fetch projects via API route
    const projectsData = await apiFetch<{ projects?: any[] }>(`/api/projects/list?tenantId=${tenantId}`, { cache: 'no-store' })
    if (cancelled) return
     
    if (projectsData.projects) {
      // Fetch hours for each project
      const projectIds = projectsData.projects.map((p: any) => p.id)
      if (projectIds.length > 0) {
        let projectHoursMap = new Map<string, number>()

        if (typeof window !== 'undefined' && !navigator.onLine) {
         const cacheKey = `project-hours:${tenantId}`
         const cached = window.localStorage.getItem(cacheKey)
         if (cached) {
          try {
           const parsed = JSON.parse(cached) as Record<string, number>
           projectHoursMap = new Map(Object.entries(parsed))
          } catch (parseErr) {
           console.warn('⚠️ Failed to parse cached project hours', parseErr)
          }
         }
        } else {
         try {
          const hoursData = await apiFetch<{ totals?: Record<string, number> }>('/api/projects/hours', {
           method: 'POST',
           body: JSON.stringify({ projectIds }),
           cache: 'no-store',
          })

          if (!cancelled) {
           const totals = hoursData?.totals || {}
           projectHoursMap = new Map(Object.entries(totals).map(([id, value]) => [id, Number(value ?? 0)]))

           if (typeof window !== 'undefined') {
            try {
             const cacheKey = `project-hours:${tenantId}`
             window.localStorage.setItem(cacheKey, JSON.stringify(totals))
            } catch (cacheErr) {
             console.warn('⚠️ Failed to cache project hours', cacheErr)
            }
           }
          }
         } catch (hoursErr) {
          console.error('Error fetching project hours API:', hoursErr)
         }
        }

       // Map projects with hours
       const projectsWithHours: ProjectType[] = projectsData.projects
        .filter((p: any) => {
         const status = p.status || null
         return status !== 'completed' && status !== 'archived'
        })
        .map((p: any) => ({
         id: p.id,
         name: p.name,
         budgeted_hours: p.budgeted_hours || 0,
         base_rate_sek: p.base_rate_sek || undefined,
         hours: projectHoursMap.get(p.id) || 0
        }))

       if (cancelled) return
       setDashboardProjects(projectsWithHours)
       setProjectsLoaded(true)
       
       // Fetch stats separately
       if (tenantId) {
        await fetchDashboardStats(tenantId)
       }
      } else {
       if (cancelled) return
       setDashboardProjects([])
       setProjectsLoaded(true)
       // Still fetch stats even if no projects
       if (tenantId) {
        await fetchDashboardStats(tenantId)
       }
      }
     } else {
      if (cancelled) return
      setProjectsLoaded(true)
      if (tenantId) {
       await fetchDashboardStats(tenantId)
      }
     }
   } catch (err) {
    if (cancelled) return
    console.error('Error fetching dashboard projects:', err)
    setProjectsLoaded(true)
    if (tenantId) {
     await fetchDashboardStats(tenantId)
    }
   }
  }

  fetchDashboardProjects()

  // Listen for project creation/update events
  const handleProjectUpdate = () => {
   console.log('🔄 Dashboard: Project updated, refreshing...')
   if (!cancelled) {
    setTimeout(() => fetchDashboardProjects(), 500) // Small delay to ensure DB commit
   }
  }

  // Listen for time entry updates specifically
  // IMPORTANT: Refresh both projects (with hours) AND stats when time entries change
  // This ensures progress bars update correctly
  const handleTimeEntryUpdate = () => {
   console.log('🔄 Dashboard: Time entry updated, refreshing projects and stats...')
   if (!cancelled && tenantId) {
    // Refresh projects first (includes hours calculation), then stats
    setTimeout(() => {
     fetchDashboardProjects()
     fetchDashboardStats(tenantId)
    }, 500)
   }
  }

  window.addEventListener('projectCreated', handleProjectUpdate)
  window.addEventListener('projectUpdated', handleProjectUpdate)
  window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
  window.addEventListener('timeEntryCreated', handleTimeEntryUpdate)
  window.addEventListener('timeEntryDeleted', handleTimeEntryUpdate)

  // Also refresh stats when component mounts or tenantId changes (after login)
  const refreshStats = () => {
   if (tenantId && !cancelled) {
    setTimeout(() => fetchDashboardStats(tenantId), 1000) // Small delay after mount
   }
  }
  refreshStats()

  // Poll for stats and projects updates every 30 seconds to keep in sync
  // This ensures progress bars stay updated even if events are missed
  const syncInterval = setInterval(() => {
   if (tenantId && !cancelled) {
    fetchDashboardProjects()
    fetchDashboardStats(tenantId)
   }
  }, 30000) // 30 seconds

  return () => {
   cancelled = true
   clearInterval(syncInterval)
   window.removeEventListener('projectCreated', handleProjectUpdate)
   window.removeEventListener('projectUpdated', handleProjectUpdate)
   window.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   window.removeEventListener('timeEntryCreated', handleTimeEntryUpdate)
   window.removeEventListener('timeEntryDeleted', handleTimeEntryUpdate)
  }
 }, [tenantId])

 const getProgressColor = useCallback((percentage: number) => {
  if (percentage > 100) return 'bg-success-500'
  if (percentage >= 90) return 'bg-error-500'
  if (percentage >= 70) return 'bg-warning-500'
  return 'bg-primary-500'
 }, [])

 // Memoize filtered projects
 const activeProjects = useMemo(() => {
  return dashboardProjects.filter(p => {
   const status = (p as any).status
   return status !== 'completed' && status !== 'archived'
  })
 }, [dashboardProjects])

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   
   {/* Main content */}
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Kontrollpanel</h1>
       <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Välkommen tillbaka, {userEmail?.split('@')[0] || 'Användare'}!</p>
      </div>
      <div className="flex gap-3 items-center">
       <NotificationCenter className="hidden sm:block" />
       <button
        onClick={() => router.push('/reports/new')}
        className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-[6px] font-medium shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all text-sm sm:text-base"
        aria-label="Rapportera tid"
       >
        Rapportera tid
       </button>
       <button
        onClick={async () => {
         if (confirm('Är du säker på att du vill logga ut?')) {
          await supabase.auth.signOut()
          router.push('/login')
         }
        }}
        className="w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-[6px] font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
        aria-label="Logga ut"
       >
        Logga ut
       </button>
      </div>
     </div>

     {/* Did You Know */}

     {/* Premium Weekly Schedules */}
     <WeeklySchedules />

     {/* Time Clock */}
     {(() => {
      if (process.env.NODE_ENV === 'development') {
       console.log('🔍 Dashboard: Rendering TimeClock with:', {
        employeeId,
        projectsCount: availableProjects.length,
        tenantId: timeClockTenantId || tenantId || undefined,
       })
      }
      return (
       <TimeClock 
        employeeId={employeeId} 
        projects={availableProjects}
        tenantId={timeClockTenantId || tenantId || undefined}
       />
      )
     })()}

     {/* Supplier Invoices - Realtime List */}
     {tenantId && (
      <div className="mb-6 sm:mb-8">
       <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">Leverantörsfakturor</h2>
       <InvoiceList tenantId={tenantId} />
      </div>
     )}

     {/* Stats Cards */}
     {!statsLoaded ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
       {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5">
         <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Laddar...</div>
         <div className="text-2xl font-bold text-gray-400 dark:text-gray-600">-</div>
        </div>
       ))}
      </div>
     ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
       <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Totalt timmar</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalHours.toFixed(1)}h</div>
       </div>
       <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Aktiva projekt</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.activeProjects}</div>
       </div>
       <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fakturor att skicka</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.invoicesToSend}</div>
       </div>
      </div>
     )}

     {/* New Project Card */}
     <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-6 lg:p-8 mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Nytt projekt</h2>
      <button
       onClick={() => router.push('/projects/new')}
       className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-[6px] font-medium shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all text-sm sm:text-base"
      >
       + Skapa nytt projekt
      </button>
     </div>

     {/* Projects Section */}
     <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Projekt</h2>
      {!projectsLoaded ? (
       <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Laddar projekt...</p>
       </div>
      ) : dashboardProjects.length === 0 ? (
       <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Inga projekt ännu. Skapa ditt första projekt!</p>
       </div>
      ) : (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {activeProjects.map((project) => {
         const hours = project.budgeted_hours || 0
         const projectHours = (project as any).hours || 0
         const percentage = hours > 0 ? (projectHours / hours) * 100 : 0
         const cappedPercentage = Math.min(percentage, 100)
         return (
          <div
           key={project.id}
           onClick={() => router.push(`/projects/${project.id}`)}
           className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5 cursor-pointer hover:shadow-md hover:-translate-y-[2px] transition-all duration-200"
          >
           <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 truncate">{project.name}</h3>
           <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
             <span>{projectHours.toFixed(1)}h / {hours}h</span>
             <span className={percentage > 100 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
              {percentage.toFixed(0)}%
             </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
             <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
              style={{ width: `${cappedPercentage}%` }}
             />
            </div>
            {percentage > 100 && (
             <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
              ⚠️ Över budget med {(percentage - 100).toFixed(0)}%
             </p>
            )}
           </div>
           {project.base_rate_sek && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
             {project.base_rate_sek} kr/timme
            </p>
           )}
          </div>
         )
        })}
       </div>
      )}
     </div>
    </div>
   </main>
  </div>
 )
}
