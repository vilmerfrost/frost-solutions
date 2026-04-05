'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import supabase from '@/utils/supabase/supabaseClient'
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
  const [timeClockTenantId, setTimeClockTenantId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTimeClockData() {
      if (!tenantId) {
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('TimeClock: No user')
          }
          return
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('TimeClock: Fetching employee for user', user.id)
        }

        // Use API route that handles RLS and service role fallback
        let foundEmployeeId: string | null = null

        try {
          const employeeData = await apiFetch<{ employeeId?: string; error?: string; suggestion?: string }>('/api/employee/get-current')
          if (employeeData.employeeId) {
            if (process.env.NODE_ENV === 'development') {
              console.log('TimeClock: Found employee ID via API:', employeeData.employeeId)
            }
            foundEmployeeId = employeeData.employeeId
          } else {
            console.warn('TimeClock: No employee found via API:', employeeData.error || employeeData.suggestion)
          }
        } catch (err) {
          console.error('TimeClock: API error:', err)
        }

        // Fallback: Try direct query if API didn't find employee
        if (!foundEmployeeId) {
          if (process.env.NODE_ENV === 'development') {
            console.log('TimeClock: Trying direct query as fallback')
          }
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('id')
            .eq('auth_user_id', user.id)
            .eq('tenant_id', tenantId)
            .maybeSingle()

          if (employeeError) {
            console.warn('TimeClock: Direct query error:', employeeError)
          } else if (employeeData) {
            const employee = employeeData as { id: string } | null
            if (employee?.id) {
              if (process.env.NODE_ENV === 'development') {
                console.log('TimeClock: Found employee ID via direct query:', employee.id)
              }
              foundEmployeeId = employee.id
            }
          }
        }

        if (foundEmployeeId) {
          setEmployeeId(foundEmployeeId)
        }

        // CRITICAL SECURITY: Always use tenantId from centralized API (same as TenantContext)
        let projectsTenantId = tenantId
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        if (!projectsTenantId || !uuidRegex.test(projectsTenantId)) {
          console.warn('Dashboard: Invalid or missing tenantId in context, fetching from centralized API...')
          try {
            const tenantData = await apiFetch<{ tenantId?: string }>('/api/tenant/get-tenant', { cache: 'no-store' })
            if (tenantData.tenantId && uuidRegex.test(tenantData.tenantId)) {
              projectsTenantId = tenantData.tenantId
              if (process.env.NODE_ENV === 'development') {
                console.log('Dashboard: Got tenantId from centralized API:', projectsTenantId)
              }
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
              console.warn('Dashboard: Context tenantId not found in database, fetching from centralized API')
              try {
                const tenantData = await apiFetch<{ tenantId?: string }>('/api/tenant/get-tenant', { cache: 'no-store' })
                if (tenantData.tenantId && uuidRegex.test(tenantData.tenantId)) {
                  projectsTenantId = tenantData.tenantId
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Dashboard: Got tenantId from centralized API:', projectsTenantId)
                  }
                }
              } catch (err) {
                console.error('Dashboard: Failed to get tenant from API:', err)
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('Dashboard: Using tenantId from context (verified):', projectsTenantId)
              }
            }
          } catch (verifyErr) {
            console.error('Dashboard: Error verifying tenant:', verifyErr)
            try {
              const tenantData = await apiFetch<{ tenantId?: string }>('/api/tenant/get-tenant', { cache: 'no-store' })
              if (tenantData.tenantId && uuidRegex.test(tenantData.tenantId)) {
                projectsTenantId = tenantData.tenantId
                if (process.env.NODE_ENV === 'development') {
                  console.log('Dashboard: Got tenantId from centralized API (after error):', projectsTenantId)
                }
              }
            } catch (err) {
              console.error('Dashboard: Failed to get tenant from API:', err)
            }
          }
        }

        if (!projectsTenantId) {
          console.error('Dashboard: CRITICAL - No valid tenantId available - cannot fetch projects safely!')
          return
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('Dashboard: Using tenantId:', projectsTenantId, 'for projects and TimeClock')
        }

        // Store the correct tenantId for TimeClock
        setTimeClockTenantId(projectsTenantId)

        // Fetch projects using API route (bypasses RLS)
        try {
          const projectsData = await apiFetch<{ projects?: Array<{ id: string; name: string }>; tenantId?: string }>('/api/projects/for-timeclock', { cache: 'no-store' })
          if (projectsData.projects && projectsData.projects.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log('TimeClock: Found projects via API', projectsData.projects.length, 'for tenant', projectsData.tenantId || projectsTenantId)
            }
            setAvailableProjects(projectsData.projects)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('TimeClock: API returned no projects for tenant', projectsData.tenantId || projectsTenantId)
            }
            setAvailableProjects([])
          }
        } catch (apiError) {
          // Fallback: Try direct query
          if (process.env.NODE_ENV === 'development') {
            console.warn('Projects API failed, trying direct query...')
          }
          let projectsResult: Array<{ id: string; name: string }> | null = null
          let projError: Error | null = null

          // Try with status filter first
          const { data, error } = await supabase
            .from('projects')
            .select('id, name')
            .eq('tenant_id', projectsTenantId)
            .neq('status', 'completed')
            .neq('status', 'archived')
            .order('name', { ascending: true })

          if (error) {
            // If status column doesn't exist, try without status filter
            if (error.code === '42703' || error.message?.includes('status')) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Status column not found, fetching all projects for tenant')
              }
              const fallback = await supabase
                .from('projects')
                .select('id, name')
                .eq('tenant_id', projectsTenantId)
                .order('name', { ascending: true })

              projectsResult = (fallback.data as Array<{ id: string; name: string }> | null)
              projError = fallback.error ? new Error(fallback.error.message) : null
            } else {
              projectsResult = (data as Array<{ id: string; name: string }> | null)
              projError = new Error(error.message)
            }
          } else {
            projectsResult = (data as Array<{ id: string; name: string }> | null)
          }

          if (projectsResult && projectsResult.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log('TimeClock: Found projects via direct query', projectsResult.length)
            }
            setAvailableProjects(projectsResult)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('TimeClock: No projects found via direct query for tenant', projectsTenantId)
            }
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

  if (process.env.NODE_ENV === 'development') {
    console.log('DashboardTimeTracking: Rendering TimeClock with:', {
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
}
