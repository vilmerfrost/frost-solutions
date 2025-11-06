'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import supabase from '@/utils/supabase/supabaseClient'
import AISummary from '@/components/AISummary'

interface AnalyticsData {
  totalHours: number
  totalRevenue: number
  activeProjects: number
  employeesCount: number
  hoursByMonth: { month: string; hours: number }[]
  revenueByMonth: { month: string; revenue: number }[]
  projectStatus: { status: string; count: number }[]
}

export default function AnalyticsPage() {
  const { tenantId } = useTenant()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    async function fetchAnalytics() {
      try {
        const now = new Date()
        let startDate: Date

        if (period === 'week') {
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 7)
        } else if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        } else {
          startDate = new Date(now.getFullYear(), 0, 1)
        }

        // Fetch time entries
        const { data: timeEntries } = await supabase
          .from('time_entries')
          .select('hours_total, amount_total, date, is_billed')
          .eq('tenant_id', tenantId)
          .gte('date', startDate.toISOString().split('T')[0])

        // Fetch invoices
        const { data: invoices } = await supabase
          .from('invoices')
          .select('amount, status, created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', startDate.toISOString())

        // Fetch projects
        const { data: projects } = await supabase
          .from('projects')
          .select('status')
          .eq('tenant_id', tenantId)

        // Fetch employees
        const { data: employees } = await supabase
          .from('employees')
          .select('id')
          .eq('tenant_id', tenantId)

        // Calculate stats
        const totalHours = (timeEntries || []).reduce((sum, e) => sum + Number(e.hours_total || 0), 0)
        const totalRevenue = (invoices || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount || 0), 0)
        const activeProjects = (projects || []).filter((p: any) => p.status === 'active').length
        const employeesCount = (employees || []).length

        // Group by month
        const hoursByMonthMap = new Map<string, number>()
        const revenueByMonthMap = new Map<string, number>()

        ;(timeEntries || []).forEach((entry: any) => {
          const month = new Date(entry.date).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short' })
          hoursByMonthMap.set(month, (hoursByMonthMap.get(month) || 0) + Number(entry.hours_total || 0))
        })

        ;(invoices || []).forEach((inv: any) => {
          if (inv.status === 'paid') {
            const month = new Date(inv.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short' })
            revenueByMonthMap.set(month, (revenueByMonthMap.get(month) || 0) + Number(inv.amount || 0))
          }
        })

        const hoursByMonth = Array.from(hoursByMonthMap.entries()).map(([month, hours]) => ({ month, hours }))
        const revenueByMonth = Array.from(revenueByMonthMap.entries()).map(([month, revenue]) => ({ month, revenue }))

        // Project status breakdown
        const statusMap = new Map<string, number>()
        ;(projects || []).forEach((p: any) => {
          const status = p.status || 'unknown'
          statusMap.set(status, (statusMap.get(status) || 0) + 1)
        })
        const projectStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))

        setData({
          totalHours,
          totalRevenue,
          activeProjects,
          employeesCount,
          hoursByMonth,
          revenueByMonth,
          projectStatus,
        })
      } catch (err) {
        console.error('Error fetching analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [tenantId, period])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Laddar analytics...</div>
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Ingen data tillgänglig</div>
        </main>
      </div>
    )
  }

  const maxHours = Math.max(...data.hoursByMonth.map(d => d.hours), 1)
  const maxRevenue = Math.max(...data.revenueByMonth.map(d => d.revenue), 1)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">Analytics</h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Insikter och statistik</p>
            </div>
            
            {/* Period Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  period === 'week'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Vecka
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  period === 'month'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Månad
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  period === 'year'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                År
              </button>
            </div>
          </div>

          {/* AI Insights */}
          {data && (
            <div className="mb-6 sm:mb-8">
              <AISummary
                type="admin-dashboard"
                data={{
                  employees: data.employeesCount,
                  activeProjects: data.activeProjects,
                  unpaidInvoices: 0, // Not available in analytics
                  totalRevenue: data.totalRevenue,
                  projects: [],
                  invoices: [],
                  analytics: {
                    totalHours: data.totalHours,
                    revenueByMonth: data.revenueByMonth,
                    hoursByMonth: data.hoursByMonth,
                    projectStatus: data.projectStatus,
                  },
                }}
              />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-1">
                {data.totalHours.toFixed(1)}h
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Totalt timmar</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-1">
                {data.totalRevenue.toLocaleString('sv-SE')} kr
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total intäkt</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-1">
                {data.activeProjects}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Aktiva projekt</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-1">
                {data.employeesCount}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Anställda</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Hours Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Timmar över tid</h2>
              <div className="space-y-3">
                {data.hoursByMonth.length > 0 ? (
                  data.hoursByMonth.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {item.month}
                      </div>
                      <div className="flex-1">
                        <div className="relative w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.hours / maxHours) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {item.hours.toFixed(1)}h
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Ingen data för denna period</p>
                )}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Intäkter över tid</h2>
              <div className="space-y-3">
                {data.revenueByMonth.length > 0 ? (
                  data.revenueByMonth.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {item.month}
                      </div>
                      <div className="flex-1">
                        <div className="relative w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {item.revenue.toLocaleString('sv-SE')} kr
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Ingen data för denna period</p>
                )}
              </div>
            </div>
          </div>

          {/* Project Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Projektstatus</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.projectStatus.map((item, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{item.count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

