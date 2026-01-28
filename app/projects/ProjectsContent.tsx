'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { createProject } from './actions'
import { toast } from '@/lib/toast'
import SearchBar from '@/components/SearchBar'
import { BASE_PATH } from '@/utils/url'
import FilterSortBar from '@/components/FilterSortBar'
import { useAdmin } from '@/hooks/useAdmin'
import { PermissionGuard } from '@/components/rbac/PermissionGuard'
import { NewProjectModal } from '@/components/projects/NewProjectModal'
import { apiFetch } from '@/lib/http/fetcher'

function Notice({
 type = 'info',
 children,
}: {
 type?: 'info' | 'success' | 'error'
 children: React.ReactNode
}) {
 const styles =
  type === 'success'
   ? 'border-green-300 bg-green-50 text-green-700'
   : type === 'error'
   ? 'border-red-300 bg-red-50 text-red-700'
   : 'border-blue-300 bg-blue-50 text-blue-700'
 return <div className={`rounded-[8px] border p-4 ${styles}`}>{children}</div>
}

export default function ProjectsContent() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const { tenantId } = useTenant()
 const [projects, setProjects] = useState<any[]>([])
 const [filteredProjects, setFilteredProjects] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [showNewForm, setShowNewForm] = useState(false)
 const [searchQuery, setSearchQuery] = useState('')
 const [statusFilter, setStatusFilter] = useState<string>('')
 const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'status'>('created_at')
 const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
 const [formData, setFormData] = useState({
  name: '',
  client_id: '',
  base_rate_sek: '360',
  budgeted_hours: '',
  status: 'planned',
 })
 const [clients, setClients] = useState<Array<{ id: string; name: string; org_number?: string }>>([])
 const [deletingId, setDeletingId] = useState<string | null>(null)
 const [projectHours, setProjectHours] = useState<Map<string, number>>(new Map())
 const [refreshTrigger, setRefreshTrigger] = useState(0)
 const [isModalOpen, setIsModalOpen] = useState(false)
 const { isAdmin, loading: adminLoading } = useAdmin()

 // Fetch clients on mount
 useEffect(() => {
  async function fetchClients() {
   if (!tenantId) return

   try {
    const { data: clientsData } = await supabase
     .from('clients')
     .select('id, name, org_number')
     .eq('tenant_id', tenantId)
     .order('name', { ascending: true })

    if (clientsData) {
     setClients(clientsData)
    }
   } catch (err) {
    console.error('Error fetching clients:', err)
   }
  }

  if (tenantId) {
   fetchClients()
  }
 }, [tenantId])

 useEffect(() => {
  if (!tenantId) {
   setLoading(false)
   return
  }

  async function fetchProjects() {
   try {
    console.log('🔍 ProjectsContent: Fetching projects for tenantId:', tenantId)
    
    // Try API route first for better reliability
    try {
     // Validate tenantId format before calling API
     if (!tenantId) {
      console.error('❌ ProjectsContent: No tenantId')
      return
     }
     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
     if (!uuidRegex.test(tenantId)) {
      console.error('❌ ProjectsContent: Invalid tenantId format:', tenantId)
      // Get correct tenantId from centralized API
      try {
       const tenantData = await apiFetch<{ tenantId?: string }>('/api/tenant/get-tenant', { cache: 'no-store' })
       if (tenantData.tenantId && uuidRegex.test(tenantData.tenantId)) {
        console.log('✅ ProjectsContent: Got corrected tenantId from API:', tenantData.tenantId)
        // Retry with corrected tenantId
        try {
         const correctedApiData = await apiFetch<{ projects?: any[] }>(`/api/projects/list?tenantId=${tenantData.tenantId}`, { cache: 'no-store' })
         console.log('📊 Projects fetched via API (corrected):', correctedApiData.projects?.length || 0, 'projects')
         if (correctedApiData.projects) {
          setProjects(correctedApiData.projects)
          setFilteredProjects(correctedApiData.projects)
          setLoading(false)
          return
         }
        } catch (correctedErr) {
         console.warn('Failed to fetch projects with corrected tenant:', correctedErr)
        }
       }
      } catch (tenantErr) {
       console.warn('Failed to fetch tenant:', tenantErr)
      }
      setProjects([])
      setFilteredProjects([])
      setLoading(false)
      return
     }
     
     try {
      const apiData = await apiFetch<{ projects?: any[] }>(`/api/projects/list?tenantId=${tenantId}`, { cache: 'no-store' })
      console.log('📊 Projects fetched via API:', apiData.projects?.length || 0, 'projects for tenantId:', tenantId)
      if (apiData.projects) {
       // Double-check that all projects belong to correct tenant
       const verifiedProjects = apiData.projects.filter((p: any) => {
        const matches = p.tenant_id === tenantId
        if (!matches) {
         console.error('❌ SECURITY: API returned project', p.id, p.name, 'with wrong tenant_id:', p.tenant_id, 'expected:', tenantId)
        }
        return matches
       })
       
       console.log('✅ ProjectsContent: Verified', verifiedProjects.length, 'projects after security check')
       setProjects(verifiedProjects)
       setFilteredProjects(verifiedProjects)
       setLoading(false)
       return
      }
     } catch (apiErr) {
      console.warn('API route failed, falling back to direct query:', apiErr)
     }
    } catch (apiErr) {
     console.warn('API route failed, falling back to direct query:', apiErr)
    }
    
    // Fallback to direct query
    // Fetch all projects - we'll filter on client side to avoid SQL issues
    if (!tenantId) return
    
    let { data, error } = await supabase
     .from('projects')
     .select('id, name, customer_name, created_at, base_rate_sek, budgeted_hours, status')
     .eq('tenant_id', tenantId)
     .order('created_at', { ascending: false })

    // If status column doesn't exist, retry without it
    if (error && (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('status'))) {
     const fallback = await supabase
      .from('projects')
      .select('id, name, customer_name, created_at, base_rate_sek, budgeted_hours')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
     
     if (fallback.error) {
      // Final fallback: minimal query
      const minimal = await supabase
       .from('projects')
       .select('id, name, created_at')
       .eq('tenant_id', tenantId)
       .order('created_at', { ascending: false })
      
      if (minimal.error) {
       console.error('Error fetching projects (all fallbacks failed):', minimal.error)
       setProjects([])
       setFilteredProjects([])
      } else {
       const minimalData = (minimal.data || []).map((p: any) => ({ ...p, status: null }))
       // Filter out completed/archived manually
       const filtered = minimalData.filter((p: any) => p.status !== 'completed' && p.status !== 'archived')
       setProjects(filtered)
       setFilteredProjects(filtered)
      }
     } else {
      const fallbackData = (fallback.data || []).map((p: any) => ({ ...p, status: null }))
      // Filter out completed/archived manually
      const filtered = fallbackData.filter((p: any) => p.status !== 'completed' && p.status !== 'archived')
      setProjects(filtered)
      setFilteredProjects(filtered)
     }
    } else if (error) {
     console.error('Error fetching projects:', error)
     setProjects([])
     setFilteredProjects([])
    } else {
     // Filter out completed/archived projects manually
     console.log('📊 Projects fetched:', data?.length || 0, 'projects')
     const filteredData = (data || []).filter((p: any) => {
      const status = p.status || null
      const shouldShow = status !== 'completed' && status !== 'archived'
      if (!shouldShow) {
       console.log('🔇 Filtering out project:', p.name, 'status:', status)
      }
      return shouldShow
     })
     console.log('✅ Projects after filtering:', filteredData.length, 'projects')
     const projectsData = filteredData.map((p: any) => ({ ...p, status: p.status || null }))
     setProjects(projectsData)
     setFilteredProjects(projectsData)
    }
   } catch (err) {
    console.error('Unexpected error:', err)
    setProjects([])
   } finally {
    setLoading(false)
   }
  }

  fetchProjects()
 }, [tenantId])

 // Fetch project hours
 useEffect(() => {
  if (!tenantId || projects.length === 0) {
   return
  }

  async function fetchProjectHours() {
   try {
    console.log('📊 Projects list: Fetching hours for', projects.length, 'projects in batch')
    // PERFORMANCE FIX: Fetch all project hours in a single batch request instead of N+1 queries
    const projectIds = projects.map(p => p.id)
    
    const hoursMap = new Map<string, number>()
    
    try {
     const data = await apiFetch<{ success?: boolean; totals?: Record<string, number> }>('/api/projects/hours', {
      method: 'POST',
      body: JSON.stringify({ projectIds }),
      cache: 'no-store',
     })
     
     if (data.success && data.totals) {
      Object.entries(data.totals).forEach(([projectId, hours]) => {
       hoursMap.set(projectId, hours as number)
      })
     }
     console.log('✅ Projects list: Batch hours fetch successful:', hoursMap.size, 'projects')
    } catch (err) {
     console.warn('❌ Failed to fetch batch hours:', err)
    }
    
    console.log('✅ Projects list: Hours map updated:', Array.from(hoursMap.entries()))
    setProjectHours(hoursMap)
   } catch (err) {
    console.error('Error fetching project hours:', err)
   }
  }

  fetchProjectHours()
 }, [tenantId, projects, refreshTrigger])

 // Listen for time entry updates
 useEffect(() => {
  const handleTimeEntryUpdate = (event: Event) => {
   const customEvent = event as CustomEvent
   console.log('🔄 Projects list: Time entry updated event received!', customEvent.detail)
   setTimeout(() => {
    console.log('⏰ Projects list: Triggering refresh...')
    setRefreshTrigger(prev => {
     const newValue = prev + 1
     console.log('✅ Projects list: Refresh trigger updated:', newValue)
     return newValue
    })
   }, 500) // Increased delay to ensure DB commit
  }
  
  // Also listen for localStorage updates (fallback)
  const handleStorageChange = (e: StorageEvent) => {
   if (e.key === 'timeEntryUpdated' && e.newValue) {
    try {
     const data = JSON.parse(e.newValue)
     console.log('🔄 Projects list: localStorage update received!', data)
     setTimeout(() => {
      setRefreshTrigger(prev => prev + 1)
     }, 500)
    } catch (err) {
     console.error('Error parsing storage event:', err)
    }
   }
  }
  
  if (typeof window !== 'undefined') {
   window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   document.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   document.body?.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   window.addEventListener('storage', handleStorageChange)
   console.log('✅ Projects list: Event listeners registered for timeEntryUpdated on window, document, and body')
   
   // Also check if there's a pending update in localStorage
   const pendingUpdate = localStorage.getItem('timeEntryUpdated')
   if (pendingUpdate) {
    try {
     const data = JSON.parse(pendingUpdate)
     console.log('🔄 Projects list: Found pending update in localStorage, triggering refresh')
     setTimeout(() => {
      setRefreshTrigger(prev => prev + 1)
     }, 500)
    } catch (err) {
     console.error('Error parsing pending update:', err)
    }
   }
  }
  
  return () => {
   if (typeof window !== 'undefined') {
    window.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate)
    document.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate)
    document.body?.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate)
    window.removeEventListener('storage', handleStorageChange)
    console.log('🔌 Projects list: Event listeners removed')
   }
  }
 }, [])

 // Filter and sort projects
 useEffect(() => {
  let filtered = [...projects]

  // Search filter
  if (searchQuery.trim()) {
   const query = searchQuery.toLowerCase()
   filtered = filtered.filter(p => 
    p.name?.toLowerCase().includes(query) ||
    p.customer_name?.toLowerCase().includes(query) ||
    p.id?.toLowerCase().includes(query)
   )
  }

  // Status filter
  if (statusFilter) {
   filtered = filtered.filter(p => p.status === statusFilter)
  }

  // Sort
  filtered.sort((a, b) => {
   let aVal: any, bVal: any
   
   if (sortBy === 'name') {
    aVal = a.name || ''
    bVal = b.name || ''
   } else if (sortBy === 'created_at') {
    aVal = new Date(a.created_at || 0).getTime()
    bVal = new Date(b.created_at || 0).getTime()
   } else {
    aVal = a.status || ''
    bVal = b.status || ''
   }

   if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
   if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
   return 0
  })

  setFilteredProjects(filtered)
 }, [projects, searchQuery, statusFilter, sortBy, sortDirection])

 async function handleCreateProject(e: React.FormEvent) {
  e.preventDefault()
  
  if (!isAdmin) {
   toast.error('Endast administratörer kan skapa projekt. Kontakta en administratör.')
   return
  }
  
  if (!formData.client_id) {
   toast.error('Välj en kund för projektet')
   return
  }

  try {
   // Get client name for backward compatibility
   const selectedClient = clients.find(c => c.id === formData.client_id)
   const customerName = selectedClient?.name || ''

   const form = new FormData()
   form.append('name', formData.name)
   form.append('client_id', formData.client_id)
   form.append('customer_name', customerName)
   form.append('base_rate_sek', formData.base_rate_sek)
   form.append('budgeted_hours', formData.budgeted_hours)
   form.append('status', formData.status)
   
   await createProject(form)
   setShowNewForm(false)
   setFormData({
    name: '',
    client_id: '',
    base_rate_sek: '360',
    budgeted_hours: '',
    status: 'planned',
   })
   // Reload projects
   if (tenantId) {
    let { data, error } = await supabase
     .from('projects')
     .select('id, name, customer_name, created_at, base_rate_sek, budgeted_hours, status')
     .eq('tenant_id', tenantId)
     .order('created_at', { ascending: false })
    
    // If status column doesn't exist, retry without it
    if (error && (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('status'))) {
     const fallback = await supabase
      .from('projects')
      .select('id, name, customer_name, created_at, base_rate_sek, budgeted_hours')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
     
     const reloadedData = (fallback.data || []).map((p: any) => ({ ...p, status: null }))
     // Filter out completed/archived manually
     const filtered = reloadedData.filter((p: any) => p.status !== 'completed' && p.status !== 'archived')
     setProjects(filtered)
     setFilteredProjects(filtered)
    } else if (!error && data) {
     // Filter out completed/archived projects manually
     const filteredData = data.filter((p: any) => 
      p.status !== 'completed' && p.status !== 'archived'
     )
     const projectsData = filteredData.map((p: any) => ({ ...p, status: p.status || null }))
     setProjects(projectsData)
     setFilteredProjects(projectsData)
    } else {
     const projectsData = (data || []).map((p: any) => ({ ...p, status: p.status || null }))
     setProjects(projectsData)
     setFilteredProjects(projectsData)
    }
   }
  } catch (err) {
   console.error('Error creating project:', err)
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
     <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
       <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-2">Projekt</h1>
       <p className="text-gray-500 dark:text-gray-400">Hantera dina projekt</p>
      </div>
      <button
       onClick={() => setIsModalOpen(true)}
       className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
      >
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
       </svg>
       Nytt projekt
      </button>
     </div>

     <NewProjectModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSuccess={() => {
       setRefreshTrigger(prev => prev + 1)
       setIsModalOpen(false)
      }}
     />

     {searchParams?.get('created') === 'true' && (
      <div className="mb-6">
       <Notice type="success">
        Projektet har skapats!
       </Notice>
      </div>
     )}

     {/* Search and Filter */}
     {projects.length > 0 && (
      <div className="mb-6 space-y-4">
       <SearchBar
        placeholder="Sök projekt, kund..."
        onSearch={setSearchQuery}
        className="max-w-md"
       />
       <FilterSortBar
        sortOptions={[
         { value: 'created_at', label: 'Datum' },
         { value: 'name', label: 'Namn' },
         { value: 'status', label: 'Status' },
        ]}
        filterOptions={[
         {
          label: 'Status',
          key: 'status',
          options: [
           { value: 'active', label: 'Pågående' },
           { value: 'planned', label: 'Planerad' },
          ],
         },
        ]}
        onSort={(value, direction) => {
         setSortBy(value as 'name' | 'created_at' | 'status')
         setSortDirection(direction)
        }}
        onFilter={(key, value) => {
         if (key === 'status') setStatusFilter(value)
        }}
        defaultSort="created_at"
        className="flex-wrap"
       />
      </div>
     )}

       {showNewForm && isAdmin && (
        <div className="mb-6 sm:mb-8 bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Skapa nytt projekt</h2>
       <form onSubmit={handleCreateProject} className="space-y-4">
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Projektnamn *</label>
         <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
         />
        </div>
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kund *</label>
         <select
          value={formData.client_id}
          onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
         >
          <option value="">Välj kund...</option>
          {clients.map((client) => (
           <option key={client.id} value={client.id}>
            {client.name} {client.org_number ? `(${client.org_number})` : ''}
           </option>
          ))}
         </select>
         {clients.length === 0 && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
           Inga kunder hittades. <a href={`${BASE_PATH}/clients/new`} className="text-primary-500 dark:text-primary-400 hover:underline">Lägg till kund</a>
          </p>
         )}
        </div>
        <div className="grid grid-cols-2 gap-4">
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timpris (SEK) *</label>
          <input
           type="number"
           value={formData.base_rate_sek}
           onChange={(e) => setFormData({ ...formData, base_rate_sek: e.target.value })}
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
           required
           min={1}
          />
         </div>
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Budgeterade timmar</label>
          <input
           type="number"
           value={formData.budgeted_hours}
           onChange={(e) => setFormData({ ...formData, budgeted_hours: e.target.value })}
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
           min={0}
          />
         </div>
        </div>
        <div className="flex gap-4">
         <button
          type="submit"
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold"
         >
          Skapa projekt
         </button>
         <button
          type="button"
          onClick={() => setShowNewForm(false)}
          className="px-6 py-3 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold"
         >
          Avbryt
         </button>
        </div>
       </form>
      </div>
     )}

     {projects.length === 0 ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-8 border border-gray-100 dark:border-gray-700 text-center">
       <p className="text-gray-500 dark:text-gray-400 mb-4">Inga projekt hittades</p>
       <button
        onClick={() => router.push('/projects/new')}
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold"
       >
        Skapa första projektet
       </button>
      </div>
     ) : filteredProjects.length === 0 ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-8 border border-gray-100 dark:border-gray-700 text-center">
       <p className="text-gray-500 dark:text-gray-400 mb-4">Inga projekt matchar dina filter</p>
       <button
        onClick={() => {
         setSearchQuery('')
         setStatusFilter('')
        }}
        className="text-primary-500 dark:text-primary-400 hover:underline"
       >
        Rensa filter
       </button>
      </div>
     ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
       {filteredProjects.map((p: any) => (
        <div
         key={p.id}
         onClick={() => router.push(`/projects/${p.id}`)}
           className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
        >
         <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{p.name}</h3>
          {p.status && (
           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            p.status === 'planned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            p.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            p.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
           }`}>
            {p.status === 'planned' ? 'Planerad' : p.status === 'active' ? 'Pågående' : 'Slutförd'}
           </span>
          )}
         </div>
         {p.customer_name && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Kund: {p.customer_name}</p>
         )}
         
         {/* Progress Bar */}
         {p.budgeted_hours && Number(p.budgeted_hours) > 0 && (
          <div className="mb-4">
           <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Timmar: {Number(projectHours.get(p.id) || 0).toFixed(1)}h</span>
            <span>{Number(p.budgeted_hours).toFixed(0)}h budget</span>
           </div>
           <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
             className={`h-full rounded-full transition-all duration-500 ${
              (Number(projectHours.get(p.id) || 0) / Number(p.budgeted_hours)) >= 0.9 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : (Number(projectHours.get(p.id) || 0) / Number(p.budgeted_hours)) >= 0.7 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                  : 'bg-gradient-to-r from-primary-500 to-primary-600'
             }`}
             style={{ 
              width: `${Math.min((Number(projectHours.get(p.id) || 0) / Number(p.budgeted_hours)) * 100, 100)}%` 
             }}
            />
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.round((Number(projectHours.get(p.id) || 0) / Number(p.budgeted_hours)) * 100)}% av budget
           </p>
          </div>
         )}
         
         {!p.budgeted_hours || Number(p.budgeted_hours) === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
           Timmar: {Number(projectHours.get(p.id) || 0).toFixed(1)}h
          </p>
         ) : null}
         
         <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Skapad: {p.created_at ? new Date(p.created_at).toLocaleDateString('sv-SE') : '—'}
         </p>
         
         {/* Action Buttons */}
         <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-2">
           <a
            className="flex-1 text-center px-4 py-2.5 bg-success-500 hover:bg-success-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all hover:scale-105 flex items-center justify-center gap-2"
            href={`/invoices/new?projectId=${p.id}`}
            onClick={(e) => e.stopPropagation()}
           >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Skapa faktura
           </a>
           <button
            onClick={async (e) => {
             e.stopPropagation()
             if (!confirm(`Vill du markera projektet "${p.name}" som klart och arkivera det?`)) return
             setDeletingId(p.id)
             try {
              const updatePayload: any = {
               status: 'completed'
              }

              if (!tenantId) {
               toast.error('Saknar tenant ID')
               return
              }

              let { error } = await (supabase
               .from('projects') as any)
               .update(updatePayload)
               .eq('id', p.id)
               .eq('tenant_id', tenantId)

              if (error && (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('status'))) {
               const { error: updateError } = await (supabase
                .from('projects') as any)
                .update({})
                .eq('id', p.id)
                .eq('tenant_id', tenantId)
               
               if (updateError) {
                error = updateError
               } else {
                const updated = projects.filter(proj => proj.id !== p.id)
                setProjects(updated)
                setFilteredProjects(updated)
                toast.success('Projekt markerat som klart!')
                setDeletingId(null)
                return
               }
              }

              if (error) throw error
              
              const updated = projects.filter(proj => proj.id !== p.id)
              setProjects(updated)
              setFilteredProjects(updated)
              toast.success('Projekt markerat som klart och arkiverat!')
             } catch (err: any) {
              console.error('Error marking project as completed:', err)
              toast.error('Kunde inte markera projekt som klart: ' + (err.message || 'Okänt fel'))
             } finally {
              setDeletingId(null)
             }
            }}
            disabled={deletingId === p.id}
            className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
            aria-label={`Markera projekt ${p.name} som klart`}
           >
            {deletingId === p.id ? (
             <span className="animate-spin">⏳</span>
            ) : (
             <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Klar
             </>
            )}
           </button>
           <button
            onClick={async (e) => {
             e.stopPropagation()
             const projectId = p.id
             const projectName = p.name
             
             if (!confirm(`Är du säker på att du vill ta bort projektet "${projectName}"? Detta går inte att ångra.`)) return
             
             setDeletingId(projectId)
             try {
              const response = await fetch(`/api/projects/${projectId}`, {
               method: 'DELETE',
              })
              const result = await response.json()
              
              if (!response.ok || !result.success) {
               toast.error(result.error || 'Kunde inte ta bort projektet')
               return
              }
              
              // Update state
              const updated = projects.filter(proj => proj.id !== projectId)
              setProjects(updated)
              setFilteredProjects(updated)
              toast.success(result.message || `Projekt "${projectName}" borttaget!`)
             } catch (err: any) {
              console.error('Error deleting project:', err)
              toast.error('Kunde inte ta bort projekt: ' + (err?.message || 'Okänt fel'))
             } finally {
              setDeletingId(null)
             }
            }}
            disabled={deletingId === p.id}
            className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
            aria-label={`Ta bort projekt ${p.name}`}
           >
            {deletingId === p.id ? (
             <span className="animate-spin">⏳</span>
            ) : (
             <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Ta bort
             </>
            )}
           </button>
          </div>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>
   </main>
  </div>
 )
}

