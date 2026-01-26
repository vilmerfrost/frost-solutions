'use client'

import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'
import SearchBar from '@/components/SearchBar'
import FilterSortBar from '@/components/FilterSortBar'
import { toast } from '@/lib/toast'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/http/fetcher'

interface TimeEntry {
 id: string
 date: string
 hours_total: number
 ob_type: string
 description?: string
 project_id: string
 employee_id: string
 projects?: { name: string }
 employees?: { full_name: string }
 status?: string
 approval_status?: string
 approved_at?: string
}

export default function ReportsPage() {
 const { tenantId } = useTenant()
 const router = useRouter()
 const [entries, setEntries] = useState<TimeEntry[]>([])
 const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([])
 const [loading, setLoading] = useState(true)
 const [searchQuery, setSearchQuery] = useState('')
 const [projectFilter, setProjectFilter] = useState<string>('')
 const [obTypeFilter, setObTypeFilter] = useState<string>('')
 const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
 const [sortBy, setSortBy] = useState<'date' | 'hours' | 'project'>('date')
 const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
 const [isAdmin, setIsAdmin] = useState(false)
 const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
 const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
 const [refreshTrigger, setRefreshTrigger] = useState(0)
 const [deletingId, setDeletingId] = useState<string | null>(null)
 const [approvingId, setApprovingId] = useState<string | null>(null)
 const [approvingAll, setApprovingAll] = useState(false)

 async function handleDeleteEntry(entryId: string) {
  if (!confirm('Är du säker på att du vill radera denna tidsrapport? Detta går inte att ångra.')) {
   return
  }

  setDeletingId(entryId)
  try {
   await apiFetch(`/api/time-entries/delete?id=${entryId}`, {
    method: 'DELETE',
   })

   toast.success('Tidsrapport raderad!')
   
   // Trigger refresh
   setRefreshTrigger(prev => prev + 1)
   
   // Also dispatch event for other pages
   if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('timeEntryUpdated'))
   }
  } catch (err: any) {
   toast.error('Fel vid radering: ' + err.message)
  } finally {
   setDeletingId(null)
  }
 }

 const isEntryApproved = (entry: TimeEntry) => {
  const status = (entry.status || '').toLowerCase()
  const approvalStatus = (entry.approval_status || '').toLowerCase()
  return (
   status === 'approved' ||
   approvalStatus === 'approved' ||
   Boolean(entry.approved_at)
  )
 }

 async function handleApproveEntry(entryId: string) {
  if (!isAdmin) return

  setApprovingId(entryId)
  try {
   const data = await apiFetch<{ success?: boolean; error?: string; message?: string; updated?: number; data?: any }>(`/api/time-entries/${entryId}/approve`, {
    method: 'POST'
   })

   if (!data?.success) {
    throw new Error(data?.error || 'Kunde inte godkänna tidsrapport')
   }

   const updatedCount = Number(data?.updated ?? 0)

   if (updatedCount > 0) {
    toast.success(data?.message || 'Tidsrapport godkänd!')

    // Uppdatera lokal state med data från servern
    if (data.data) {
     setEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry
      return {
       ...entry,
       status: 'approved',
       approval_status: data.data.approval_status || 'approved',
       approved_at: data.data.approved_at || new Date().toISOString(),
      }
     }))
    }

    // Vänta 1 sekund innan refetch för att säkerställa Supabase commit
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Trigger backend refresh to ensure consistent state
    setRefreshTrigger(prev => prev + 1)

    // Trigger refresh for other components
    if (typeof window !== 'undefined') {
     window.dispatchEvent(new CustomEvent('timeEntryUpdated', { detail: { entryId, type: 'approved' } }))
    }
   } else {
    toast.info('Inga tidsrapporter behövde godkännas')
   }
  } catch (err: any) {
   toast.error('Fel vid godkännande: ' + err.message)
  } finally {
   setApprovingId(null)
  }
 }

 async function handleApproveAll() {
  if (!isAdmin) return

  setApprovingAll(true)
  try {
   console.log('[Frontend] 🚀 Starting approve all...')
   
   const data = await apiFetch<{ success?: boolean; error?: string; message?: string; updated?: number; count?: number; data?: any[]; _debug?: any }>('/api/time-entries/approve-all', {
    method: 'POST',
   })
   
   console.log('[Frontend] 📊 API Response:', {
    success: data.success,
    updated: data.updated,
    count: data.count,
    debug: data._debug,
    sampleData: data.data?.slice(0, 3),
   })

   if (!data?.success) {
    throw new Error(data?.error || 'Kunde inte godkänna tidsrapporter')
   }

  const updatedCount = Number(data?.updated ?? data?.count ?? 0)

  if (updatedCount > 0) {
   // CRITICAL: Update local state with data from server response
   if (data.data && Array.isArray(data.data)) {
    const approvedIds = new Set(data.data.map((e: any) => e.id))
    
    console.log('[Frontend] 📝 Updating local state for', approvedIds.size, 'entries')
    
    setEntries(prev => prev.map(entry => {
     if (approvedIds.has(entry.id)) {
      const serverEntry = data.data?.find((e: any) => e.id === entry.id)
      const updated = {
       ...entry,
       status: 'approved',
       approval_status: serverEntry?.approval_status || 'approved',
       approved_at: serverEntry?.approved_at || new Date().toISOString(),
      }
      console.log('[Frontend] Updated entry:', {
       id: entry.id,
       approval_status: updated.approval_status,
       approved_at: updated.approved_at,
      })
      return updated
     }
     return entry
    }))
   }

    toast.success(data?.message || `Godkände ${updatedCount} tidsrapporter`)

    // CRITICAL FIX: Poll until backend confirms approval_status is 'approved'
    // This avoids race conditions where refetch happens before commit
    console.log('[Frontend] ⏳ Polling until backend confirms approval...')
    
    let tries = 0
    let synced = false
    const maxTries = 5
    
    while (tries < maxTries && !synced) {
     await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s between checks
     
     console.log(`[Frontend] 🔍 Poll attempt ${tries + 1}/${maxTries}...`)
     
     try {
      const checkData = await apiFetch<{ entries?: any[] }>('/api/time-entries/list', { 
       cache: 'no-store',
      })
      const entries = checkData.entries || []
      
      // Check if all entries that should be approved are actually approved
      const approvedIds = new Set(data.data?.map((e: any) => e.id) || [])
      const relevantEntries = entries.filter((e: any) => approvedIds.has(e.id))
      
      synced = relevantEntries.length > 0 && 
           relevantEntries.every((e: any) => e.approval_status === 'approved')
      
      console.log('[Frontend] Poll result:', {
       totalEntries: entries.length,
       relevantEntries: relevantEntries.length,
       allApproved: synced,
       sample: relevantEntries.slice(0, 3).map((e: any) => ({
        id: e.id,
        approval_status: e.approval_status,
       })),
      })
     } catch (pollError) {
      console.error('[Frontend] Poll error:', pollError)
     }
     
     tries++
    }

    if (synced) {
     console.log('[Frontend] ✅ Backend confirmed approval, triggering refetch')
    } else {
     console.warn('[Frontend] ⚠️ Polling timeout, but proceeding with refetch')
    }

    // Trigger refetch after polling confirms backend is ready
    setRefreshTrigger(prev => prev + 1)

    if (typeof window !== 'undefined') {
     window.dispatchEvent(new CustomEvent('timeEntryUpdated', { 
      detail: { type: 'approved-all', count: updatedCount } 
     }))
    }
   } else {
    toast.info(data?.message || 'Inga tidsrapporter behövde godkännas')
   }
  } catch (err: any) {
   console.error('[Frontend] ❌ Error:', err)
   toast.error('Fel vid massgodkännande: ' + err.message)
  } finally {
   setApprovingAll(false)
  }
 }

 useEffect(() => {
  if (!tenantId) {
   setLoading(false)
   return
  }

  async function fetchEntries() {
   try {
    // Use API route with service role to bypass RLS
    console.log('🔍 Reports: Fetching time entries via API', { tenantId })
    
    let result: any
    try {
     result = await apiFetch<{ entries?: any[]; isAdmin?: boolean; employeeId?: string }>('/api/time-entries/list', {
      cache: 'no-store'
     })
    } catch (apiErr) {
     console.error('Error fetching time entries from API:', apiErr)
     setEntries([])
     setFilteredEntries([])
     setLoading(false)
     return
    }
    
    const entries = (result.entries || []) as any[]
    
    // Update admin status from API response
    if (result.isAdmin !== undefined) {
     setIsAdmin(result.isAdmin)
    }
    if (result.employeeId) {
     setCurrentEmployeeId(result.employeeId)
    }
    
    // Logga approval-status för debugging
    const sampleWithApproval = entries.slice(0, 5).map((e: any) => ({
     id: e.id,
     hours: e.hours_total,
     date: e.date,
     approval_status: e.approval_status,
     approved_at: e.approved_at,
     status: e.status,
    }))
    
    console.log('🔍 Reports: API result', {
     dataCount: entries.length,
     isAdmin: result.isAdmin,
     employeeId: result.employeeId,
     sample: sampleWithApproval,
     approvedCount: entries.filter((e: any) => {
      const status = (e.status || '').toLowerCase()
      const approvalStatus = (e.approval_status || '').toLowerCase()
      return status === 'approved' || approvalStatus === 'approved' || Boolean(e.approved_at)
     }).length,
    })
    
    // Filter out entries with 0 hours, but keep all entries with any hours > 0
    // This ensures that entries with 0.1, 0.5, etc. are shown
    const validEntries = entries.filter(e => {
     const hours = Number(e.hours_total || 0)
     return hours > 0 // Show all entries with any hours > 0
    })
    
    console.log('📊 Reports: Fetched entries', {
     total: entries.length,
     valid: validEntries.length,
     zeroHours: entries.filter(e => Number(e.hours_total || 0) === 0).length,
     sample: validEntries.slice(0, 5).map(e => ({ id: e.id, hours: e.hours_total, date: e.date, ob_type: e.ob_type }))
    })
    
    const projectIds = [...new Set(validEntries.map(e => e.project_id).filter(Boolean))]
    const employeeIds = [...new Set(validEntries.map(e => e.employee_id).filter(Boolean))]
    
    const [projectsData, employeesData] = await Promise.all([
     projectIds.length > 0 && tenantId ? supabase.from('projects').select('id, name').in('id', projectIds).eq('tenant_id', tenantId) : Promise.resolve({ data: [], error: null }),
     employeeIds.length > 0 && tenantId ? supabase.from('employees').select('id, full_name').in('id', employeeIds).eq('tenant_id', tenantId) : Promise.resolve({ data: [], error: null })
    ])
    
    const projectsMap = new Map((projectsData.data || []).map((p: any) => [p.id, p]))
    const employeesMap = new Map((employeesData.data || []).map((e: any) => [e.id, e]))
    
    const enriched = validEntries.map(e => ({
     ...e,
     description: null, // Description column doesn't exist, so always null
     projects: projectsMap.get(e.project_id) ? { name: projectsMap.get(e.project_id).name } : null,
     employees: employeesMap.get(e.employee_id) ? { full_name: employeesMap.get(e.employee_id).full_name } : null,
     // CRITICAL: Behåll approval_status, approved_at från API-svaret
     approval_status: e.approval_status,
     approved_at: e.approved_at,
     status: e.status,
    }))
    
    console.log('📊 Reports: Enriched entries', {
     total: enriched.length,
     withApprovalStatus: enriched.filter(e => e.approval_status).length,
     approved: enriched.filter(e => isEntryApproved(e)).length,
     sample: enriched.slice(0, 3).map(e => ({
      id: e.id,
      approval_status: e.approval_status,
      approved_at: e.approved_at,
      isApproved: isEntryApproved(e),
     })),
    })
    
    setEntries(enriched)
    setFilteredEntries(enriched)
   } catch (err: any) {
    console.error('Unexpected error fetching time entries:', err)
    setEntries([])
    setFilteredEntries([])
   } finally {
    setLoading(false)
   }
  }

  fetchEntries()
  
  // Listen for time entry updates (from TimeClock checkout)
  const handleTimeEntryUpdate = (event: Event) => {
   const customEvent = event as CustomEvent
   console.log('🔄 Time entry updated event received, refreshing reports...', customEvent.detail)
   // Small delay to ensure database has committed the changes
   setTimeout(() => {
    setRefreshTrigger(prev => prev + 1)
   }, 300)
  }
  
  // Set up event listener
  if (typeof window !== 'undefined') {
   window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   console.log('✅ Reports page: Event listener registered for timeEntryUpdated')
  }
  
  return () => {
   if (typeof window !== 'undefined') {
    window.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   }
  }
 }, [tenantId, isAdmin, currentEmployeeId, refreshTrigger])

 // Fetch projects for filter
 useEffect(() => {
  if (!tenantId) return

  async function fetchProjects() {
   try {
    const { data } = await supabase
     .from('projects')
     .select('id, name')
     .eq('tenant_id', tenantId as string)
     .order('name', { ascending: true })

    if (data) {
     setProjects(data)
    }
   } catch (err) {
    console.error('Error fetching projects:', err)
   }
  }

  fetchProjects()
 }, [tenantId])

 // Filter and sort entries
 useEffect(() => {
  let filtered = [...entries]

  // Search filter
  if (searchQuery.trim()) {
   const query = searchQuery.toLowerCase()
   filtered = filtered.filter(e => 
    (e.projects as any)?.name?.toLowerCase().includes(query) ||
    (e.employees as any)?.full_name?.toLowerCase().includes(query) ||
    e.description?.toLowerCase().includes(query) ||
    e.date?.includes(query) ||
    e.ob_type?.toLowerCase().includes(query)
   )
  }

  // Project filter
  if (projectFilter) {
   filtered = filtered.filter(e => e.project_id === projectFilter)
  }

  // OB type filter
  if (obTypeFilter) {
   filtered = filtered.filter(e => e.ob_type === obTypeFilter)
  }

  // Date filter
  if (dateFilter !== 'all') {
   const now = new Date()
   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
   let cutoffDate: Date

   if (dateFilter === 'today') {
    cutoffDate = today
   } else if (dateFilter === 'week') {
    cutoffDate = new Date(today)
    cutoffDate.setDate(cutoffDate.getDate() - 7)
   } else { // month
    cutoffDate = new Date(today)
    cutoffDate.setMonth(cutoffDate.getMonth() - 1)
   }

   filtered = filtered.filter(e => {
    const entryDate = new Date(e.date)
    return entryDate >= cutoffDate
   })
  }

  // Sort
  filtered.sort((a, b) => {
   let aVal: any, bVal: any
   
   if (sortBy === 'date') {
    aVal = new Date(a.date || 0).getTime()
    bVal = new Date(b.date || 0).getTime()
   } else if (sortBy === 'hours') {
    aVal = Number(a.hours_total || 0)
    bVal = Number(b.hours_total || 0)
   } else {
    aVal = ((a.projects as any)?.name || '').toLowerCase()
    bVal = ((b.projects as any)?.name || '').toLowerCase()
   }

   if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
   if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
   return 0
  })

  setFilteredEntries(filtered)
 }, [entries, searchQuery, projectFilter, obTypeFilter, dateFilter, sortBy, sortDirection])

 const totalHours = filteredEntries.reduce((sum, e) => sum + Number(e.hours_total || 0), 0)
 const obHours = filteredEntries.filter(e => e.ob_type && e.ob_type !== 'work').reduce((sum, e) => sum + Number(e.hours_total || 0), 0)

 function obLabel(type: string) {
  switch (type) {
   case 'evening': return 'OB Kväll'
   case 'night': return 'OB Natt'
   case 'weekend': return 'OB Helg'
   case 'vacation': return 'Semester'
   case 'sick': return 'Sjukdom'
   case 'vabb': return 'VAB'
   case 'absence': return 'Frånvaro'
   default: return 'Vanlig tid'
  }
 }

 if (loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Tidsrapporter</h1>
       <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Alla rapporterade timmar</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
       {isAdmin && (
        <button
         onClick={handleApproveAll}
         disabled={approvingAll}
         className="w-full sm:w-auto bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
         {approvingAll ? 'Godkänner...' : 'Godkänn alla'}
        </button>
       )}
       <button
        onClick={() => router.push('/reports/new')}
        className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm sm:text-base"
       >
        + Ny tidsrapport
       </button>
      </div>
     </div>

     {/* Stats */}
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-105">
       <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1">{totalHours.toFixed(1)}h</div>
       <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Totalsumma</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-105">
       <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1">{obHours.toFixed(1)}h</div>
       <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Varav OB-timmar</div>
      </div>
     </div>

     {/* Entries */}
     {!tenantId ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 text-center text-red-500">
       Ingen tenant vald.
      </div>
     ) : entries.length === 0 ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
       Inga rapporter än.
      </div>
     ) : (
      <>
       {/* Search and Filter */}
       <div className="mb-6 space-y-4">
        <SearchBar
         placeholder="Sök projekt, anställd, beskrivning..."
         onSearch={setSearchQuery}
         className="max-w-md"
        />
        <FilterSortBar
         sortOptions={[
          { value: 'date', label: 'Datum' },
          { value: 'hours', label: 'Timmar' },
          { value: 'project', label: 'Projekt' },
         ]}
         filterOptions={[
          {
           label: 'Projekt',
           key: 'project',
           options: [
            { value: '', label: 'Alla projekt' },
            ...projects.map(p => ({ value: p.id, label: p.name })),
           ],
          },
          {
           label: 'OB-typ',
           key: 'ob_type',
           options: [
            { value: '', label: 'Alla typer' },
            { value: 'work', label: 'Vanlig tid' },
            { value: 'evening', label: 'OB Kväll' },
            { value: 'night', label: 'OB Natt' },
            { value: 'weekend', label: 'OB Helg' },
            { value: 'vacation', label: 'Semester' },
            { value: 'sick', label: 'Sjukdom' },
            { value: 'vabb', label: 'VAB' },
           ],
          },
          {
           label: 'Period',
           key: 'date',
           options: [
            { value: 'all', label: 'Alla datum' },
            { value: 'today', label: 'Idag' },
            { value: 'week', label: 'Senaste veckan' },
            { value: 'month', label: 'Senaste månaden' },
           ],
          },
         ]}
         onSort={(value, direction) => {
          setSortBy(value as 'date' | 'hours' | 'project')
          setSortDirection(direction)
         }}
         onFilter={(key, value) => {
          if (key === 'project') setProjectFilter(value)
          if (key === 'ob_type') setObTypeFilter(value)
          if (key === 'date') setDateFilter(value as 'all' | 'today' | 'week' | 'month')
         }}
         defaultSort="date"
         className="flex-wrap"
        />
       </div>

       {filteredEntries.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
         <p className="mb-4">Inga tidsrapporter matchar dina filter</p>
         <button
          onClick={() => {
           setSearchQuery('')
           setProjectFilter('')
           setObTypeFilter('')
           setDateFilter('all')
          }}
          className="text-primary-500 dark:text-primary-400 hover:underline"
         >
          Rensa filter
         </button>
        </div>
       ) : (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
       {/* Mobile scroll hint */}
       <div className="sm:hidden p-2 text-center text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        Svep för att se alla kolumner →
       </div>
       <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <table className="w-full text-xs sm:text-sm min-w-[640px]">
         <thead className="bg-gray-50">
          <tr>
           <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Datum</th>
           <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Anställd</th>
           <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Projekt</th>
           <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Typ</th>
           <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
           <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Timmar</th>
           <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Åtgärder</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-gray-100">
          {filteredEntries.map(entry => (
           <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
            <td className="p-3 sm:p-4 text-gray-900 dark:text-white">
             {new Date(entry.date).toLocaleDateString('sv-SE')}
            </td>
            <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
             {(entry.employees as any)?.full_name || 'Okänd'}
            </td>
            <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
             {(entry.projects as any)?.name || entry.project_id?.slice(0, 8) || '–'}
            </td>
            <td className="p-3 sm:p-4">
             <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
              entry.ob_type === 'work' ? 'bg-blue-100 text-blue-800' :
              entry.ob_type === 'evening' ? 'bg-purple-100 text-purple-800' :
              entry.ob_type === 'night' ? 'bg-indigo-100 text-indigo-800' :
              entry.ob_type === 'weekend' ? 'bg-pink-100 text-pink-800' :
              entry.ob_type === 'vacation' || entry.ob_type === 'sick' || entry.ob_type === 'vabb' || entry.ob_type === 'absence' ?
              'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
             }`}>
              {obLabel(entry.ob_type || 'work')}
             </span>
            </td>
            <td className="p-3 sm:p-4">
             {isEntryApproved(entry) ? (
              <Badge variant="success">Godkänd</Badge>
             ) : (
              <Badge variant="warning">Ej godkänd</Badge>
             )}
            </td>
            <td className="p-3 sm:p-4 text-right font-semibold text-gray-900 dark:text-white">
             {Number(entry.hours_total || 0).toFixed(1)}h
            </td>
            <td className="p-3 sm:p-4 text-right">
             <div className="flex items-center justify-end gap-3">
              {isAdmin && !isEntryApproved(entry) && (
               <button
                onClick={() => handleApproveEntry(entry.id)}
                disabled={approvingId === entry.id}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
               >
                {approvingId === entry.id ? 'Godkänner...' : 'Godkänn'}
               </button>
              )}
              <button
               onClick={() => handleDeleteEntry(entry.id)}
               disabled={deletingId === entry.id}
               className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               title="Radera tidsrapport"
              >
               {deletingId === entry.id ? (
                <span className="text-xs">Raderar...</span>
               ) : (
                <span className="text-sm font-bold">🗑️</span>
               )}
              </button>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>
       )}
      </>
     )}
    </div>
   </main>
  </div>
 )
}
