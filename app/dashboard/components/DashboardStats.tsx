'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/http/fetcher'

interface DashboardStatsData {
  totalHours: number
  activeProjects: number
  invoicesToSend: number
}

interface DashboardStatsProps {
  tenantId: string
  initialStats: DashboardStatsData
}

export function DashboardStats({ tenantId, initialStats }: DashboardStatsProps) {
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsData>(initialStats)
  const [statsLoaded, setStatsLoaded] = useState(false)

  const fetchDashboardStats = useCallback(async () => {
    const cacheKey = `dashboard-stats:${tenantId}`
    try {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const cached = window.localStorage.getItem(cacheKey)
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as DashboardStatsData
            setDashboardStats(parsed)
            setStatsLoaded(true)
            return
          } catch (parseErr) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to parse cached dashboard stats', parseErr)
            }
          }
        }
      }

      const result = await apiFetch<{
        success?: boolean
        data?: { totalHours?: number; activeProjects?: number; invoicesToSend?: number }
        error?: string
      }>('/api/dashboard/stats', { cache: 'no-store' })

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid dashboard stats response')
      }

      const newStats: DashboardStatsData = {
        totalHours: Number(result.data.totalHours ?? 0),
        activeProjects: Number(result.data.activeProjects ?? 0),
        invoicesToSend: Number(result.data.invoicesToSend ?? 0),
      }

      setDashboardStats(newStats)

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(newStats))
        } catch (cacheErr) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to cache dashboard stats', cacheErr)
          }
        }
      }

      setStatsLoaded(true)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setStatsLoaded(true)
    }
  }, [tenantId])

  useEffect(() => {
    let cancelled = false

    const doFetch = async () => {
      if (!cancelled) {
        await fetchDashboardStats()
      }
    }

    // Initial fetch with small delay
    const initialTimeout = setTimeout(doFetch, 1000)

    const handleTimeEntryUpdate = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('DashboardStats: Time entry updated, refreshing stats...')
      }
      if (!cancelled) {
        setTimeout(() => fetchDashboardStats(), 500)
      }
    }

    window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
    window.addEventListener('timeEntryCreated', handleTimeEntryUpdate)
    window.addEventListener('timeEntryDeleted', handleTimeEntryUpdate)

    // Poll every 30 seconds
    const syncInterval = setInterval(() => {
      if (!cancelled) {
        fetchDashboardStats()
      }
    }, 30000)

    return () => {
      cancelled = true
      clearTimeout(initialTimeout)
      clearInterval(syncInterval)
      window.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate)
      window.removeEventListener('timeEntryCreated', handleTimeEntryUpdate)
      window.removeEventListener('timeEntryDeleted', handleTimeEntryUpdate)
    }
  }, [fetchDashboardStats])

  if (!statsLoaded) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Laddar...</div>
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-600">-</div>
          </div>
        ))}
      </div>
    )
  }

  return (
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
  )
}
