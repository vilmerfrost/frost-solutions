'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/http/fetcher'

interface ProjectWithHours {
  id: string
  name: string
  budgeted_hours?: number
  base_rate_sek?: number
  hours?: number
}

interface DashboardProjectsProps {
  tenantId: string
}

export function DashboardProjects({ tenantId }: DashboardProjectsProps) {
  const router = useRouter()
  const [dashboardProjects, setDashboardProjects] = useState<ProjectWithHours[]>([])
  const [projectsLoaded, setProjectsLoaded] = useState(false)

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage > 100) return 'bg-success-500'
    if (percentage >= 90) return 'bg-error-500'
    if (percentage >= 70) return 'bg-warning-500'
    return 'bg-primary-500'
  }, [])

  const activeProjects = useMemo(() => {
    return dashboardProjects.filter(p => {
      // Projects already filtered by status during fetch, but guard against stale data
      const status = 'status' in p ? (p as ProjectWithHours & { status?: string }).status : undefined
      return status !== 'completed' && status !== 'archived'
    })
  }, [dashboardProjects])

  const fetchDashboardProjects = useCallback(async () => {
    try {
      const projectsData = await apiFetch<{
        projects?: Array<{
          id: string
          name: string
          budgeted_hours?: number
          base_rate_sek?: number
          status?: string
        }>
      }>(`/api/projects/list?tenantId=${tenantId}`, { cache: 'no-store' })

      if (projectsData.projects) {
        const projectIds = projectsData.projects.map(p => p.id)
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
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Failed to parse cached project hours', parseErr)
                }
              }
            }
          } else {
            try {
              const hoursData = await apiFetch<{ totals?: Record<string, number> }>('/api/projects/hours', {
                method: 'POST',
                body: JSON.stringify({ projectIds }),
                cache: 'no-store',
              })

              const totals = hoursData?.totals || {}
              projectHoursMap = new Map(Object.entries(totals).map(([id, value]) => [id, Number(value ?? 0)]))

              if (typeof window !== 'undefined') {
                try {
                  const cacheKey = `project-hours:${tenantId}`
                  window.localStorage.setItem(cacheKey, JSON.stringify(totals))
                } catch (cacheErr) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('Failed to cache project hours', cacheErr)
                  }
                }
              }
            } catch (hoursErr) {
              console.error('Error fetching project hours API:', hoursErr)
            }
          }

          const projectsWithHours: ProjectWithHours[] = projectsData.projects
            .filter(p => {
              const status = p.status || null
              return status !== 'completed' && status !== 'archived'
            })
            .map(p => ({
              id: p.id,
              name: p.name,
              budgeted_hours: p.budgeted_hours || 0,
              base_rate_sek: p.base_rate_sek || undefined,
              hours: projectHoursMap.get(p.id) || 0,
            }))

          setDashboardProjects(projectsWithHours)
          setProjectsLoaded(true)
        } else {
          setDashboardProjects([])
          setProjectsLoaded(true)
        }
      } else {
        setProjectsLoaded(true)
      }
    } catch (err) {
      console.error('Error fetching dashboard projects:', err)
      setProjectsLoaded(true)
    }
  }, [tenantId])

  useEffect(() => {
    let cancelled = false

    const doFetch = async () => {
      if (!cancelled) {
        await fetchDashboardProjects()
      }
    }

    doFetch()

    const handleProjectUpdate = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('DashboardProjects: Project updated, refreshing...')
      }
      if (!cancelled) {
        setTimeout(() => fetchDashboardProjects(), 500)
      }
    }

    const handleTimeEntryUpdate = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('DashboardProjects: Time entry updated, refreshing...')
      }
      if (!cancelled) {
        setTimeout(() => fetchDashboardProjects(), 500)
      }
    }

    window.addEventListener('projectCreated', handleProjectUpdate)
    window.addEventListener('projectUpdated', handleProjectUpdate)
    window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
    window.addEventListener('timeEntryCreated', handleTimeEntryUpdate)
    window.addEventListener('timeEntryDeleted', handleTimeEntryUpdate)

    // Poll every 30 seconds
    const syncInterval = setInterval(() => {
      if (!cancelled) {
        fetchDashboardProjects()
      }
    }, 30000)

    return () => {
      cancelled = true
      clearInterval(syncInterval)
      window.removeEventListener('projectCreated', handleProjectUpdate)
      window.removeEventListener('projectUpdated', handleProjectUpdate)
      window.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate)
      window.removeEventListener('timeEntryCreated', handleTimeEntryUpdate)
      window.removeEventListener('timeEntryDeleted', handleTimeEntryUpdate)
    }
  }, [fetchDashboardProjects])

  return (
    <>
      {/* New Project Card */}
      <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-6 lg:p-8 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Nytt projekt</h2>
        <button
          onClick={() => router.push('/projects/new')}
          className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-gray-900 px-5 py-2.5 rounded-[6px] font-medium shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all text-sm sm:text-base"
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
              const projectHours = project.hours || 0
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
                        {'\u26A0\uFE0F'} Över budget med {(percentage - 100).toFixed(0)}%
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
    </>
  )
}
