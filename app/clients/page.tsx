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

interface Client {
  id: string
  name: string
  email?: string
  address?: string
  org_number?: string
  created_at?: string
}

export default function ClientsPage() {
  const router = useRouter()
  const { tenantId } = useTenant()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const { isAdmin } = useAdmin()

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    async function fetchClients() {
      try {
        // Admin check is done by useAdmin hook

        // Try with org_number first
        // Only show non-archived clients by default
        let { data, error } = await supabase
          .from('clients')
          .select('id, name, email, address, org_number, created_at, archived, status')
          .eq('tenant_id', tenantId)
          .order('name', { ascending: true })

        // If org_number column doesn't exist, retry without it
        if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
          const fallback = await supabase
            .from('clients')
            .select('id, name, email, address, created_at')
            .eq('tenant_id', tenantId)
            .order('name', { ascending: true })
          
          if (fallback.error) {
            // Final fallback: minimal query
            const minimal = await supabase
              .from('clients')
              .select('id, name')
              .eq('tenant_id', tenantId)
              .order('name', { ascending: true })
            
            if (minimal.error) {
              console.error('Error fetching clients (all fallbacks failed):', minimal.error)
              setClients([])
            } else {
              setClients((minimal.data || []).map((c: any) => ({
                ...c,
                email: null,
                address: null,
                org_number: null,
              })))
            }
          } else {
            const fallbackClients = (fallback.data || []).map((c: any) => ({
              ...c,
              org_number: null,
            }))
            // Filter out archived clients
            setClients(fallbackClients.filter((c: any) => 
              c.archived !== true && c.status !== 'archived'
            ))
          }
        } else if (error) {
          console.error('Error fetching clients:', error)
          setClients([])
        } else {
          // Filter out archived clients
          const activeClients = (data || []).filter((c: any) => 
            c.archived !== true && c.status !== 'archived'
          )
          setClients(activeClients)
          setFilteredClients(activeClients)
        }
      } catch (err: any) {
        console.error('Unexpected error:', err)
        setClients([])
        setFilteredClients([])
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [tenantId])

  // Filter and sort clients
  useEffect(() => {
    let filtered = [...clients]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.org_number?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query) ||
        c.id?.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      if (sortBy === 'name') {
        aVal = (a.name || '').toLowerCase()
        bVal = (b.name || '').toLowerCase()
      } else {
        aVal = new Date(a.created_at || 0).getTime()
        bVal = new Date(b.created_at || 0).getTime()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredClients(filtered)
  }, [clients, searchQuery, sortBy, sortDirection])

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
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">Kunder</h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Hantera dina kunder</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {filteredClients.length > 0 && (
                <ExportToIntegrationButton
                  type="customer"
                  resourceId={filteredClients[0].id}
                  resourceIds={filteredClients.map(c => c.id)}
                  variant="button"
                  className="w-full sm:w-auto"
                />
              )}
              <PermissionGuard resource="clients" action="create">
                <button
                  onClick={() => router.push('/clients/new')}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base"
                >
                  + Lägg till kund
                </button>
              </PermissionGuard>
            </div>
          </div>

          {!tenantId ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center text-red-500">
              Ingen tenant vald.
            </div>
          ) : clients.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="mb-4">Inga kunder ännu.</p>
              <PermissionGuard resource="clients" action="create">
                <button
                  onClick={() => router.push('/clients/new')}
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  + Lägg till första kunden
                </button>
              </PermissionGuard>
            </div>
          ) : (
            <>
              {/* Search and Filter */}
              <div className="mb-6 space-y-4">
                <SearchBar
                  placeholder="Sök kund, email, org.nr..."
                  onSearch={setSearchQuery}
                  className="max-w-md"
                />
                <FilterSortBar
                  sortOptions={[
                    { value: 'name', label: 'Namn' },
                    { value: 'created_at', label: 'Datum' },
                  ]}
                  filterOptions={[]}
                  onSort={(value, direction) => {
                    setSortBy(value as 'name' | 'created_at')
                    setSortDirection(direction)
                  }}
                  onFilter={() => {}}
                  defaultSort="name"
                  className="flex-wrap"
                />
              </div>

              {filteredClients.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-4">Inga kunder matchar dina filter</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Rensa sökning
                  </button>
                </div>
              ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {(client.name && client.name.length > 0) ? client.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const isArchived = (client as any).archived === true || (client as any).status === 'archived'
                            
                            if (isArchived) {
                              // Restore client
                              if (!confirm(`Vill du återställa kunden "${client.name}"?`)) return
                              
                              try {
                                const res = await fetch(`/api/clients/${client.id}/archive`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'restore' }),
                                })
                                
                                if (!res.ok) {
                                  const error = await res.json()
                                  throw new Error(error.error || 'Kunde inte återställa kund')
                                }
                                
                                // Refresh list
                                const updatedClients = clients.map(c => 
                                  c.id === client.id 
                                    ? { ...c, archived: false, status: 'active' }
                                    : c
                                )
                                setClients(updatedClients)
                                toast.success(`${client.name} har återställts`)
                              } catch (err: any) {
                                console.error('Error restoring client:', err)
                                toast.error('Kunde inte återställa kund: ' + err.message)
                              }
                            } else {
                              // Archive client
                              if (!confirm(`Vill du arkivera kunden "${client.name}"? Den kommer att flyttas till arkivet.`)) return
                              
                              try {
                                const res = await fetch(`/api/clients/${client.id}/archive`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'archive' }),
                                })
                                
                                if (!res.ok) {
                                  const error = await res.json()
                                  throw new Error(error.error || 'Kunde inte arkivera kund')
                                }
                                
                                // Remove from active list
                                setClients(clients.filter(c => c.id !== client.id))
                                toast.success(`${client.name} har arkiverats`)
                              } catch (err: any) {
                                console.error('Error archiving client:', err)
                                toast.error('Kunde inte arkivera kund: ' + err.message)
                              }
                            }
                          }}
                          className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-all"
                          title={(client as any).archived || (client as any).status === 'archived' ? "Återställ kund" : "Arkivera kund"}
                        >
                          {(client as any).archived || (client as any).status === 'archived' ? '🔄' : '📦'}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm(`Är du säker på att du vill ta bort ${client.name} permanent? Detta kan inte ångras.`)) {
                              try {
                                const response = await fetch(`/api/clients/${client.id}/delete`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                })

                                const result = await response.json()

                                if (!response.ok) {
                                  console.error('Error deleting client:', result)
                                  
                                  // Show more helpful error messages
                                  if (result.error?.includes('active projects')) {
                                    toast.error(
                                      `Kunden kan inte tas bort eftersom den har ${result.activeProjectCount || result.projectCount || ''} aktiva projekt. Arkivera kunden istället.`,
                                      { duration: 5000 }
                                    )
                                  } else if (result.error?.includes('associated projects')) {
                                    toast.error(
                                      `Kunden kan inte tas bort eftersom den har ${result.projectCount || ''} associerade projekt. Arkivera kunden istället.`,
                                      { duration: 5000 }
                                    )
                                  } else if (result.error?.includes('associated invoices')) {
                                    toast.error(
                                      `Kunden kan inte tas bort eftersom den har ${result.invoiceCount || ''} associerade fakturor. Arkivera kunden istället.`,
                                      { duration: 5000 }
                                    )
                                  } else {
                                    toast.error('Kunde inte ta bort kund: ' + (result.error || 'Okänt fel'))
                                  }
                                } else {
                                  // Remove from local state
                                  setClients(clients.filter(c => c.id !== client.id))
                                  toast.success(`${client.name} har tagits bort`)
                                }
                              } catch (err: any) {
                                console.error('Unexpected error:', err)
                                toast.error('Ett oväntat fel uppstod: ' + err.message)
                              }
                            }
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
                          title="Ta bort kund permanent"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{client.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    {client.org_number && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Org.nr:</span>
                        <span>{client.org_number}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-xl">📧</span>
                        <a href={`mailto:${client.email}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-xl mt-0.5">📍</span>
                        <span>{client.address}</span>
                      </div>
                    )}
                  </div>
                  
                  {client.created_at && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tillagd: {new Date(client.created_at).toLocaleDateString('sv-SE', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

