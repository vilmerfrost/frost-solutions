'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useInvoices } from '@/hooks/useInvoices'
import Sidebar from '@/components/Sidebar'
import SearchBar from '@/components/SearchBar'
import FilterSortBar from '@/components/FilterSortBar'
import { toast } from '@/lib/toast'
import { ExportToIntegrationButton } from '@/components/integrations/ExportToIntegrationButton'
import { PermissionGuard } from '@/components/rbac/PermissionGuard'
import { apiFetch } from '@/lib/http/fetcher'

type Invoice = {
 id: string,
 amount: number,
 customer_name?: string,
 customer_id?: string,
 project_id?: string,
 number?: string,
 status?: string
}

export default function InvoicesPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 
 // Use React Query hook för automatisk caching och state management
 const { data: invoices = [], isLoading, error: queryError, refetch } = useInvoices()
 
 const [searchQuery, setSearchQuery] = useState('')
 const [statusFilter, setStatusFilter] = useState<string>('')
 const [sortBy, setSortBy] = useState<'created_at' | 'amount' | 'status'>('created_at')
 const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
 
 // Helper to get date for sorting
 const getInvoiceDate = (inv: Invoice & { created_at?: string; issue_date?: string }) => {
  return inv.created_at || (inv as any).issue_date || null
 }

 // Listen for invoice events och refetch React Query cache
 useEffect(() => {
  const handleInvoiceCreated = () => {
   setTimeout(() => refetch(), 500)
  }
  
  const handleInvoiceUpdated = () => {
   setTimeout(() => refetch(), 500)
  }

  window.addEventListener('invoiceCreated', handleInvoiceCreated)
  window.addEventListener('invoiceUpdated', handleInvoiceUpdated)
  window.addEventListener('invoiceDeleted', handleInvoiceCreated)

  return () => {
   window.removeEventListener('invoiceCreated', handleInvoiceCreated)
   window.removeEventListener('invoiceUpdated', handleInvoiceUpdated)
   window.removeEventListener('invoiceDeleted', handleInvoiceCreated)
  }
 }, [refetch])

 // Handle query errors
 useEffect(() => {
  if (queryError) {
   console.error('Error fetching invoices:', queryError)
  }
 }, [queryError])

 // Memoize filtered and sorted invoices for performance
 const filteredInvoices = useMemo(() => {
  let filtered = [...invoices]

  // Search filter
  if (searchQuery.trim()) {
   const query = searchQuery.toLowerCase()
   filtered = filtered.filter(inv => 
    inv.customer_name?.toLowerCase().includes(query) ||
    inv.id?.toLowerCase().includes(query) ||
    getInvoiceDate(inv)?.toLowerCase().includes(query)
   )
  }

  // Status filter - exclude archived by default unless explicitly filtered
  if (statusFilter) {
   filtered = filtered.filter(inv => inv.status === statusFilter)
  } else {
   // By default, exclude archived invoices
   filtered = filtered.filter(inv => inv.status !== 'archived')
  }

  // Sort
  filtered.sort((a, b) => {
   let aVal: any, bVal: any
   
   if (sortBy === 'created_at') {
    aVal = new Date(getInvoiceDate(a) || 0).getTime()
    bVal = new Date(getInvoiceDate(b) || 0).getTime()
   } else if (sortBy === 'amount') {
    aVal = Number(a.amount || 0)
    bVal = Number(b.amount || 0)
   } else {
    aVal = a.status || ''
    bVal = b.status || ''
   }

   if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
   if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
   return 0
  })

  return filtered
 }, [invoices, searchQuery, statusFilter, sortBy, sortDirection])

 if (isLoading) {
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
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Fakturor</h1>
       <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Hantera dina fakturor</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
       {filteredInvoices.length > 0 && (
        <ExportToIntegrationButton
         type="invoice"
         resourceId={filteredInvoices[0].id}
         resourceIds={filteredInvoices.map(inv => inv.id)}
         variant="button"
         className="w-full sm:w-auto"
        />
       )}
       <PermissionGuard resource="invoices" action="create">
        <button
         onClick={() => router.push('/invoices/new')}
         className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm sm:text-base"
        >
         + Ny faktura
        </button>
       </PermissionGuard>
      </div>
     </div>

     {!tenantId ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-8 text-center text-red-500">
       Ingen tenant vald — välj tenant eller logga in.
      </div>
     ) : invoices.length === 0 ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
       <p className="mb-4">Inga fakturor funna än!</p>
       <button
        onClick={() => router.push('/invoices/new')}
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
       >
        + Skapa första fakturan
       </button>
      </div>
     ) : (
      <>
       {/* Search and Filter */}
       <div className="mb-6 space-y-4">
        <SearchBar
         placeholder="Sök faktura, kund..."
         onSearch={setSearchQuery}
         className="max-w-md"
        />
        <FilterSortBar
         sortOptions={[
          { value: 'created_at', label: 'Datum' },
          { value: 'amount', label: 'Belopp' },
          { value: 'status', label: 'Status' },
         ]}
         filterOptions={[
          {
           label: 'Status',
           key: 'status',
           options: [
            { value: 'draft', label: 'Utkast' },
            { value: 'sent', label: 'Skickad' },
            { value: 'paid', label: 'Betalad' },
            { value: 'archived', label: 'Arkiverad' },
            { value: 'cancelled', label: 'Avbruten' },
           ],
          },
         ]}
         onSort={(value, direction) => {
          setSortBy(value as 'created_at' | 'amount' | 'status')
          setSortDirection(direction)
         }}
         onFilter={(key, value) => {
          if (key === 'status') setStatusFilter(value)
         }}
         defaultSort="created_at"
         className="flex-wrap"
        />
       </div>

       {filteredInvoices.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
         <p className="mb-4">Inga fakturor matchar dina filter</p>
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
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
       <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-xs sm:text-sm min-w-[640px]">
         <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
           <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Datum</th>
           <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Kund</th>
           <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Belopp</th>
           <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
           <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Åtgärder</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredInvoices.map(inv => (
           <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400 text-sm">
             {getInvoiceDate(inv) 
              ? new Date(getInvoiceDate(inv)!).toLocaleDateString('sv-SE')
              : '–'
             }
            </td>
            <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">{inv.customer_name || inv.customer_id || '–'}</td>
            <td className="p-3 sm:p-4 text-right font-semibold text-gray-900 dark:text-white">
             {Number(inv.amount || 0).toLocaleString('sv-SE')} kr
            </td>
            <td className="p-3 sm:p-4">
             <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
              inv.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              inv.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              inv.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              inv.status === 'archived' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
             }`}>
              {inv.status === 'draft' ? 'Utkast' :
               inv.status === 'sent' ? 'Skickad' :
               inv.status === 'paid' ? 'Betalad' :
               inv.status === 'archived' ? 'Arkiverad' :
               'Utkast'}
             </span>
            </td>
            <td className="p-3 sm:p-4 text-right">
             <div className="flex items-center justify-end gap-2">
              <button
               className="bg-primary-500 hover:bg-primary-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:shadow-md transition-all"
               onClick={() => router.push(`/invoices/${inv.id}`)}
              >
               Visa
              </button>
              {inv.status !== 'archived' && (
               <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:shadow-md transition-all"
                onClick={async () => {
                 if (!confirm('Vill du arkivera denna faktura?')) return
                 
                 try {
                  await apiFetch(`/api/invoices/${inv.id}/archive`, {
                   method: 'PATCH',
                   body: JSON.stringify({ action: 'archive' }),
                  })
                  
                  toast.success('Faktura arkiverad!')
                  
                  // Refresh invoices list
                  window.location.reload()
                 } catch (err: any) {
                  toast.error('Fel: ' + (err.message || 'Okänt fel'))
                 }
                }}
               >
                Arkivera
               </button>
              )}
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
