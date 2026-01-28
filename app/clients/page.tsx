'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'
import SearchBar from '@/components/SearchBar'
import FilterSortBar from '@/components/FilterSortBar'
import { ExportToIntegrationButton } from '@/components/integrations/ExportToIntegrationButton'
import { PermissionGuard } from '@/components/rbac/PermissionGuard'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'

interface Client {
 id: string
 name: string
 email?: string
 address?: string
 org_number?: string
 phone?: string
 created_at?: string
 archived?: boolean
 status?: string
}

export default function ClientsPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [clients, setClients] = useState<Client[]>([])
 const [filteredClients, setFilteredClients] = useState<Client[]>([])
 const [loading, setLoading] = useState(true)
 const [searchQuery, setSearchQuery] = useState('')
 const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all')
 const [sortBy, setSortBy] = useState<'name' | 'created_at'>('name')
 const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
 const [deletingId, setDeletingId] = useState<string | null>(null)
 const { isAdmin, loading: adminLoading } = useAdmin()

 // Wait for TenantContext to hydrate
 useEffect(() => {
  if (!tenantId) {
   // Only show warning after a delay to avoid false positives during hydration
   const timeout = setTimeout(() => {
    if (!tenantId) {
     console.log('⚠️ ClientsPage: No tenantId available after hydration delay')
    }
   }, 1000)
   setLoading(false)
   return () => clearTimeout(timeout)
  }

  async function fetchClients() {
   if (!tenantId) return
   try {
    console.log('🔍 ClientsPage: Fetching clients for tenantId:', tenantId)

    const { data, error } = await supabase
     .from('clients')
     .select('id, name, email, address, org_number, phone, created_at, archived, status')
     .eq('tenant_id', tenantId)
     .order('name', { ascending: true })

    if (error) {
     console.error('❌ ClientsPage: Error fetching clients:', error)
     // Tyst loggning - försök med minimal select
     try {
      const fallback = await supabase
       .from('clients')
       .select('id, name, email')
       .eq('tenant_id', tenantId)
       .order('name', { ascending: true })

      if (!fallback.error && fallback.data) {
       console.log('✅ ClientsPage: Found', fallback.data.length, 'clients via fallback query')
       setClients(
        (fallback.data || []).map((c: any) => ({
         id: c.id,
         name: c.name || 'Okänd',
         email: c.email,
        }))
       )
      } else {
       console.error('❌ ClientsPage: Fallback query also failed:', fallback.error)
       setClients([])
      }
     } catch {
      setClients([])
     }
    } else {
     console.log('✅ ClientsPage: Found', data?.length || 0, 'clients for tenantId:', tenantId)
     setClients(
      (data || []).map((c: any) => ({
       id: c.id,
       name: c.name || 'Okänd',
       email: c.email,
       address: c.address,
       org_number: c.org_number,
       phone: c.phone,
       created_at: c.created_at,
       archived: c.archived || c.status === 'archived',
       status: c.status,
      }))
     )
    }
   } catch (err) {
    console.error('Unexpected error:', err)
   } finally {
    setLoading(false)
   }
  }

  fetchClients()
 }, [tenantId])

 // Apply filters and sorting when dependencies change
 useEffect(() => {
  let result = [...clients]

  // Apply search filter
  if (searchQuery) {
   const query = searchQuery.toLowerCase()
   result = result.filter(
    (client) =>
     client.name.toLowerCase().includes(query) ||
     client.email?.toLowerCase().includes(query) ||
     client.org_number?.toLowerCase().includes(query) ||
     client.phone?.toLowerCase().includes(query)
   )
  }

  // Apply status filter
  if (statusFilter === 'active') {
   result = result.filter((client) => !client.archived && client.status !== 'archived')
  } else if (statusFilter === 'archived') {
   result = result.filter((client) => client.archived || client.status === 'archived')
  }

  // Apply sorting
  result.sort((a, b) => {
   let compareValue = 0

   if (sortBy === 'name') {
    compareValue = a.name.localeCompare(b.name)
   } else if (sortBy === 'created_at') {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
    compareValue = dateA - dateB
   }

   return sortDirection === 'asc' ? compareValue : -compareValue
  })

  setFilteredClients(result)
 }, [clients, searchQuery, statusFilter, sortBy, sortDirection])

 async function handleDeleteClient(clientId: string) {
  if (!tenantId) return
  if (!confirm('Är du säker på att du vill radera denna kund? Detta går inte att ångra.')) {
   return
  }

  setDeletingId(clientId)
  try {
   const response = await fetch(`/api/clients/${clientId}/delete`, {
    method: 'DELETE',
   })
   const result = await response.json()

   if (!response.ok || result.error) {
    console.error('Error deleting client:', result.error)
    toast.error(result.message || result.error || 'Kunde inte radera kund')
    return
   }

   toast.success(result.message || 'Kund raderad!')
   setClients((prev) => prev.filter((c) => c.id !== clientId))
  } catch (err: any) {
   toast.error('Fel vid radering: ' + err.message)
  } finally {
   setDeletingId(null)
  }
 }

 async function handleToggleArchive(clientId: string, currentArchived: boolean) {
  if (!tenantId) return
  try {
   const response = await fetch(`/api/clients/${clientId}/archive`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: currentArchived ? 'restore' : 'archive' }),
   })
   const result = await response.json()

   if (!response.ok || result.error) {
    console.error('Error toggling archive:', result.error)
    toast.error(result.error || 'Kunde inte ändra arkiveringsstatus')
    return
   }

   toast.success(currentArchived ? 'Kund återställd!' : 'Kund arkiverad!')

   // Update local state
   setClients((prev) =>
    prev.map((c) =>
     c.id === clientId
      ? {
         ...c,
         archived: !currentArchived,
         status: !currentArchived ? 'archived' : 'active',
        }
      : c
    )
   )
  } catch (err: any) {
   toast.error('Fel: ' + err.message)
  }
 }

 if (!tenantId && !loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <Sidebar />
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
     <div className="max-w-7xl mx-auto">
      <div className="bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 p-4 rounded-[8px]">
       <p className="text-sm text-yellow-700 dark:text-yellow-300">
        <strong>⚠️ Ingen tenant hittades.</strong> Vänligen logga in igen.
       </p>
      </div>
     </div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
   <Sidebar />
   <main className="flex-1 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto">
     {/* Header */}
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
       <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">Kunder</h1>
       <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Hantera dina kunder och företag
       </p>
      </div>
      <PermissionGuard resource="clients" action="create">
       <button
        onClick={() => router.push('/clients/new')}
        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] font-semibold shadow-sm hover:shadow-md transition-all"
       >
        + Ny kund
       </button>
      </PermissionGuard>
     </div>

     {/* Search and Filters */}
     <div className="mb-6 space-y-4">
      <SearchBar onSearch={setSearchQuery} placeholder="Sök kunder..." />

      {/* Simple inline filters */}
      <div className="flex flex-wrap gap-4 items-center">
       <select 
        value={statusFilter} 
        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
       >
        <option value="all">Alla kunder</option>
        <option value="active">Aktiva</option>
        <option value="archived">Arkiverade</option>
       </select>
       <select 
        value={sortBy} 
        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
       >
        <option value="name">Sortera: Namn</option>
        <option value="created_at">Sortera: Skapad</option>
       </select>
       <button 
        onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
       >
        {sortDirection === 'asc' ? '↑' : '↓'}
       </button>
      </div>
     </div>

     {/* Loading State */}
     {loading && (
      <div className="text-center py-12">
       <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
       <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar kunder...</p>
      </div>
     )}

     {/* Empty State */}
     {!loading && filteredClients.length === 0 && !searchQuery && (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700">
       <div className="mb-4 text-4xl">👥</div>
       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Inga kunder ännu</h3>
       <p className="text-gray-600 dark:text-gray-400 mb-6">Kom igång genom att lägga till din första kund.</p>
       <PermissionGuard resource="clients" action="create">
        <button
         onClick={() => router.push('/clients/new')}
         className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] font-semibold shadow-sm hover:shadow-md transition-all"
        >
         + Lägg till kund
        </button>
       </PermissionGuard>
      </div>
     )}

     {/* No Search Results */}
     {!loading && filteredClients.length === 0 && searchQuery && (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700">
       <div className="mb-4 text-4xl">🔍</div>
       <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Inga kunder hittades
       </h3>
       <p className="text-gray-600 dark:text-gray-400">
        Försök med andra söktermer eller rensa filtren.
       </p>
      </div>
     )}

     {/* Clients Grid */}
     {!loading && filteredClients.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
       {filteredClients.map((client) => (
        <div
         key={client.id}
         className="bg-white dark:bg-gray-800 rounded-[8px] shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
         onClick={() => router.push(`/clients/${client.id}`)}
        >
         <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {client.name}
           </h3>
           {client.org_number && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Org.nr: {client.org_number}</p>
           )}
          </div>
          {(client.archived || client.status === 'archived') && (
           <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            Arkiverad
           </span>
          )}
         </div>

         {client.email && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
           📧 {client.email}
          </p>
         )}
         {client.phone && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
           📞 {client.phone}
          </p>
         )}

         <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
           onClick={(e) => {
            e.stopPropagation()
            handleToggleArchive(client.id, client.archived || client.status === 'archived')
           }}
           className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-[6px] transition-colors flex items-center justify-center gap-2"
          >
           {(client as any).archived || (client as any).status === 'archived' ? (
            <>
             <RotateCcw className="w-4 h-4" />
             Återställ
            </>
           ) : (
            <>
             <Archive className="w-4 h-4" />
             Arkivera
            </>
           )}
          </button>

          {isAdmin && (
           <button
            onClick={(e) => {
             e.stopPropagation()
             handleDeleteClient(client.id)
            }}
            disabled={deletingId === client.id}
            className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-[6px] transition-colors disabled:opacity-50"
           >
            {deletingId === client.id ? (
             <span className="animate-spin">⏳</span>
            ) : (
             <Trash2 className="w-4 h-4" />
            )}
           </button>
          )}
         </div>

         {/* Export Button */}
         <div className="mt-3">
<ExportToIntegrationButton
            type="customer"
            resourceId={client.id}
            resourceName={client.name}
           />
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
