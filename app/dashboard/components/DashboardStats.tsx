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

  const fetchDashboardStats = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && !navigator.onLine) return

      const result = await apiFetch<{
        success?: boolean
        data?: { totalHours?: number; activeProjects?: number; invoicesToSend?: number }
        error?: string
      }>('/api/dashboard/stats', { cache: 'no-store' })

      if (!result.success || !result.data) return

      setDashboardStats({
        totalHours: Number(result.data.totalHours ?? 0),
        activeProjects: Number(result.data.activeProjects ?? 0),
        invoicesToSend: Number(result.data.invoicesToSend ?? 0),
      })
    } catch (err) {
      // Silently fail — we already have initialStats from server
    }
  }, [tenantId])

  useEffect(() => {
    let cancelled = false

    const handleTimeEntryUpdate = () => {
      if (!cancelled) {
        setTimeout(() => fetchDashboardStats(), 500)
      }
    }

    window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
    window.addEventListener('timeEntryCreated', handleTimeEntryUpdate)
    window.addEventListener('timeEntryDeleted', handleTimeEntryUpdate)

    // Poll every 2 minutes for background refresh
    const syncInterval = setInterval(() => {
      if (!cancelled) fetchDashboardStats()
    }, 120000)

    return () => {
      cancelled = true
      clearInterval(syncInterval)
      window.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate)
      window.removeEventListener('timeEntryCreated', handleTimeEntryUpdate)
      window.removeEventListener('timeEntryDeleted', handleTimeEntryUpdate)
    }
  }, [fetchDashboardStats])

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
