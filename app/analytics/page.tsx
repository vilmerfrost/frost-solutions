'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { BASE_PATH } from '@/utils/url'

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
    // Use API route instead of direct Supabase calls (avoids RLS issues)
    const response = await fetch(`${BASE_PATH}/api/analytics?period=${period}&_t=${Date.now()}`, {
     cache: 'no-store',
     headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
     },
     credentials: 'include',
    });

    if (!response.ok) {
     const errorData = await response.json().catch(() => ({}));
     throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
     setData(result.data);
    } else {
     throw new Error(result.error || 'Failed to fetch analytics');
    }
   } catch (err: any) {
    // Only log if error has meaningful content
    if (err && (err.message || err.code || typeof err === 'string')) {
     console.error('Error fetching analytics:', err.message || err.code || err);
    }
   } finally {
    setLoading(false);
   }
  }

  fetchAnalytics()
 }, [tenantId, period])

 if (loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-gray-500 dark:text-gray-400">Laddar analytics...</div>
    </main>
   </div>
  )
 }

 if (!data) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
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
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Analytics</h1>
       <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Insikter och statistik</p>
      </div>
      
      {/* Period Selector */}
      <div className="flex gap-2">
       <button
        onClick={() => setPeriod('week')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
         period === 'week'
          ? 'bg-primary-500 hover:bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
       >
        Vecka
       </button>
       <button
        onClick={() => setPeriod('month')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
         period === 'month'
          ? 'bg-primary-500 hover:bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
       >
        Månad
       </button>
       <button
        onClick={() => setPeriod('year')}
        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
         period === 'year'
          ? 'bg-primary-500 hover:bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
       >
        År
       </button>
      </div>
     </div>


     {/* Stats Grid */}
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
       <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1">
        {data.totalHours.toFixed(1)}h
       </div>
       <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Totalt timmar</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
       <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1">
        {data.totalRevenue.toLocaleString('sv-SE')} kr
       </div>
       <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total intäkt</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
       <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1">
        {data.activeProjects}
       </div>
       <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Aktiva projekt</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
       <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1">
        {data.employeesCount}
       </div>
       <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Anställda</div>
      </div>
     </div>

     {/* Charts */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Hours Chart */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
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
              className="absolute inset-y-0 left-0 bg-primary-500 hover:bg-primary-600 rounded-full transition-all duration-500"
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
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
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
              className="absolute inset-y-0 left-0 bg-success-500 hover:bg-success-600 rounded-full transition-all duration-500"
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
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Projektstatus</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
       {data.projectStatus.map((item, index) => (
        <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
         <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{item.count}</div>
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

