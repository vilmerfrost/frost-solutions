'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { apiFetch } from '@/lib/http/fetcher'

const TimeClock = dynamic(() => import('@/components/TimeClock'), {
  loading: () => <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />,
  ssr: false,
})

interface DashboardTimeTrackingProps {
  tenantId: string
}

export function DashboardTimeTracking({ tenantId }: DashboardTimeTrackingProps) {
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (!tenantId) return

    let cancelled = false

    // Fetch employee and projects in parallel — tenantId is already validated server-side
    async function fetchTimeClockData() {
      try {
        const [employeeResult, projectsResult] = await Promise.allSettled([
          apiFetch<{ employeeId?: string }>('/api/employee/get-current'),
          apiFetch<{ projects?: Array<{ id: string; name: string }> }>('/api/projects/for-timeclock', { cache: 'no-store' }),
        ])

        if (cancelled) return

        if (employeeResult.status === 'fulfilled' && employeeResult.value.employeeId) {
          setEmployeeId(employeeResult.value.employeeId)
        }

        if (projectsResult.status === 'fulfilled' && projectsResult.value.projects) {
          setAvailableProjects(projectsResult.value.projects)
        }
      } catch (err) {
        console.error('TimeClock: Error fetching data:', err)
      }
    }

    fetchTimeClockData()
    return () => { cancelled = true }
  }, [tenantId])

  return (
    <TimeClock
      employeeId={employeeId}
      projects={availableProjects}
      tenantId={tenantId}
    />
  )
}
