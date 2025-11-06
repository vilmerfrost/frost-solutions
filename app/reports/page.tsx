'use client'

import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'
import SearchBar from '@/components/SearchBar'
import FilterSortBar from '@/components/FilterSortBar'
import { toast } from '@/lib/toast'
import AISummary from '@/components/AISummary'

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

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('Är du säker på att du vill radera denna tidsrapport? Detta går inte att ångra.')) {
      return
    }

    setDeletingId(entryId)
    try {
      const response = await fetch(`/api/time-entries/delete?id=${entryId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error('Kunde inte radera tidsrapport: ' + (result.error || 'Okänt fel'))
        return
      }

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

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    async function fetchEntries() {
      try {
        // Use API route with service role to bypass RLS
        console.log('🔍 Reports: Fetching time entries via API', { tenantId })
        
        const response = await fetch('/api/time-entries/list', {
          cache: 'no-store'
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error fetching time entries from API:', errorData)
          setEntries([])
          setFilteredEntries([])
          setLoading(false)
          return
        }
        
        const result = await response.json()
        const entries = (result.entries || []) as any[]
        
        // Update admin status from API response
        if (result.isAdmin !== undefined) {
          setIsAdmin(result.isAdmin)
        }
        if (result.employeeId) {
          setCurrentEmployeeId(result.employeeId)
        }
        
        console.log('🔍 Reports: API result', {
          dataCount: entries.length,
          isAdmin: result.isAdmin,
          employeeId: result.employeeId,
          sample: entries.slice(0, 3).map((e: any) => ({ id: e.id, hours: e.hours_total, date: e.date }))
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
        }))
        
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
          .eq('tenant_id', tenantId)
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">Tidsrapporter</h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Alla rapporterade timmar</p>
            </div>
            <button
              onClick={() => router.push('/reports/new')}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base"
            >
              + Ny tidsrapport
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-1">{totalHours.toFixed(1)}h</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Totalsumma</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-105">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-1">{obHours.toFixed(1)}h</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Varav OB-timmar</div>
            </div>
          </div>

          {/* AI Summary of Time Reports */}
          {entries.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <AISummary
                type="time-reports"
                data={{
                  entries: entries.slice(0, 50), // Limit to first 50 for performance
                  totalHours,
                  obHours,
                  totalEntries: entries.length,
                }}
                className="mb-6 sm:mb-8"
              />
            </div>
          )}

          {/* Entries */}
          {!tenantId ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center text-red-500">
              Ingen tenant vald.
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
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
                <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-4">Inga tidsrapporter matchar dina filter</p>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setProjectFilter('')
                      setObTypeFilter('')
                      setDateFilter('all')
                    }}
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Rensa filter
                  </button>
                </div>
              ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[640px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Datum</th>
                      <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Anställd</th>
                      <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Projekt</th>
                      <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Typ</th>
                      <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Timmar</th>
                      <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Åtgärd</th>
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
                        <td className="p-3 sm:p-4 text-right font-semibold text-gray-900 dark:text-white">
                          {Number(entry.hours_total || 0).toFixed(1)}h
                        </td>
                        <td className="p-3 sm:p-4 text-right">
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
