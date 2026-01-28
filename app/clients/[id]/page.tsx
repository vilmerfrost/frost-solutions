'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'
import { Edit2, Archive, RotateCcw, Trash2, FileText } from 'lucide-react'
import { ExportToIntegrationButton } from '@/components/integrations/ExportToIntegrationButton'
import { apiFetch } from '@/lib/http/fetcher'
import { BASE_PATH } from '@/utils/url'

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

interface Project {
 id: string
 name: string
 status?: string
 budgeted_hours?: number
 base_rate_sek?: number
}

interface Invoice {
 id: string
 number?: string
 amount: number
 status?: string
 issue_date?: string
}

export default function ClientDetailPage() {
 const router = useRouter()
 const params = useParams()
 const { tenantId } = useTenant()
 const { isAdmin } = useAdmin()
 const clientId = params?.id as string

 const [client, setClient] = useState<Client | null>(null)
 const [projects, setProjects] = useState<Project[]>([])
 const [invoices, setInvoices] = useState<Invoice[]>([])
 const [loading, setLoading] = useState(true)
 const [totalRevenue, setTotalRevenue] = useState(0)
 const [totalHours, setTotalHours] = useState(0)

 useEffect(() => {
  if (!clientId || !tenantId) {
   if (!tenantId) {
    return // Wait for tenantId
   }
   setLoading(false)
   return
  }

  async function fetchClientData() {
   if (!tenantId) return
   try {
    // Fetch client
    let { data: clientData, error: clientError } = await supabase
     .from('clients')
     .select('id, name, email, address, org_number, phone, created_at, archived, status')
     .eq('id', clientId)
     .eq('tenant_id', tenantId)
     .single()

    // Fallback if columns don't exist
    if (clientError && (clientError.code === '42703' || clientError.code === '400')) {
     const fallback: any = await supabase
      .from('clients')
      .select('id, name, email, address')
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .single()
     
     if (!fallback.error && fallback.data) {
      clientData = { ...fallback.data, org_number: null, phone: null } as any
      clientError = null
     }
    }

    if (clientError || !clientData) {
     toast.error('Kunde inte hämta kund')
     router.push('/clients')
     return
    }

    setClient(clientData as Client)

    // Fetch projects for this client
    let { data: projectsData, error: projectsError } = await supabase
     .from('projects')
     .select('id, name, status, budgeted_hours, base_rate_sek')
     .eq('client_id', clientId)
     .eq('tenant_id', tenantId)
     .order('created_at', { ascending: false })

    if (projectsError && (projectsError.code === '42703' || projectsError.code === '400')) {
     const fallback = await supabase
      .from('projects')
      .select('id, name')
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId)
     
     if (!fallback.error) {
      projectsData = fallback.data
     }
    }

    setProjects((projectsData || []) as Project[])

    // Fetch invoices for this client
    let { data: invoicesData, error: invoicesError } = await supabase
     .from('invoices')
     .select('id, number, amount, status, issue_date')
     .eq('customer_id', clientId)
     .eq('tenant_id', tenantId)
     .order('created_at', { ascending: false })
     .limit(10)

    if (invoicesError && (invoicesError.code === '42703' || invoicesError.code === '400')) {
     const fallback = await supabase
      .from('invoices')
      .select('id, number, amount, status')
      .eq('customer_id', clientId)
      .eq('tenant_id', tenantId)
      .limit(10)
     
     if (!fallback.error) {
      invoicesData = fallback.data
     }
    }

    const invoicesList = (invoicesData || []) as Invoice[]
    setInvoices(invoicesList)

    // Calculate total revenue
    const revenue = invoicesList
     .filter(inv => inv.status === 'paid')
     .reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
    setTotalRevenue(revenue)

    // Calculate total hours from projects
    const { data: timeEntriesData } = await supabase
     .from('time_entries')
     .select('hours_total')
     .in('project_id', (projectsData || []).map((p: any) => p.id))
     .eq('tenant_id', tenantId)
     .eq('is_billed', false)

    const hours = ((timeEntriesData || []) as any[]).reduce((sum, entry) => sum + Number(entry.hours_total || 0), 0)
    setTotalHours(hours)

   } catch (err: any) {
    console.error('Error fetching client data:', err)
    toast.error('Ett fel uppstod: ' + err.message)
   } finally {
    setLoading(false)
   }
  }

  fetchClientData()
 }, [clientId, tenantId, router])

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

 if (!client) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-red-500">Kunden hittades inte</div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
       <button
        onClick={() => router.push('/clients')}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
       >
        ← Tillbaka
       </button>
       <div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
         {client.name}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Kundinformation</p>
       </div>
      </div>
      {isAdmin && (
       <div className="flex gap-3">
        <button
         onClick={() => router.push(`/clients/${clientId}/edit`)}
         className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
        >
         <Edit2 className="w-4 h-4 inline mr-1" /> Redigera
        </button>
        {/* AI-stöd Export-knapp */}
        {client && (
         <ExportToIntegrationButton
          type="customer"
          resourceId={client.id}
          resourceName={client.name}
          variant="button"
          className="mr-2"
         />
        )}
        <button
         onClick={async () => {
          if (confirm(`Vill du arkivera kunden "${client.name}"?`)) {
           try {
            await apiFetch(`/api/clients/${clientId}/archive`, {
             method: 'PATCH',
             body: JSON.stringify({ action: 'archive' }),
            })
            toast.success('Kund arkiverad')
            router.push('/clients')
           } catch (err: any) {
            toast.error('Fel: ' + err.message)
           }
          }
         }}
         className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
        >
         <Archive className="w-4 h-4 inline mr-1" /> Arkivera
        </button>
       </div>
      )}
     </div>

     {/* Stats Cards */}
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
       <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Projekt</div>
       <div className="text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400">{projects.length}</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
       <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Totala timmar</div>
       <div className="text-2xl sm:text-3xl font-semibold text-primary-500 dark:text-primary-400">{totalHours.toFixed(1)}h</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
       <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Omsättning</div>
       <div className="text-2xl sm:text-3xl font-semibold text-green-600 dark:text-green-400">{totalRevenue.toLocaleString('sv-SE')} kr</div>
      </div>
     </div>

     {/* Client Info */}
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Kontaktinformation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
       {client.org_number && (
        <div>
         <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Organisationsnummer</div>
         <div className="text-lg font-semibold text-gray-900 dark:text-white">{client.org_number}</div>
        </div>
       )}
       {client.email && (
        <div>
         <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">E-post</div>
         <a href={`mailto:${client.email}`} className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          {client.email}
         </a>
        </div>
       )}
       {client.phone && (
        <div>
         <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Telefon</div>
         <a href={`tel:${client.phone}`} className="text-lg font-semibold text-gray-900 dark:text-white">
          {client.phone}
         </a>
        </div>
       )}
       {client.address && (
        <div>
         <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Adress</div>
         <div className="text-lg font-semibold text-gray-900 dark:text-white">{client.address}</div>
        </div>
       )}
       {client.created_at && (
        <div>
         <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Skapad</div>
         <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {new Date(client.created_at).toLocaleDateString('sv-SE', {
           year: 'numeric',
           month: 'long',
           day: 'numeric'
          })}
         </div>
        </div>
       )}
      </div>
     </div>

     {/* Projects */}
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
       <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Projekt</h2>
       <button
        onClick={() => router.push(`${BASE_PATH}/projects/new?clientId=${clientId}`)}
        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold hover:shadow-md transition-all text-sm sm:text-base"
       >
        + Nytt projekt
       </button>
      </div>
      {projects.length === 0 ? (
       <p className="text-gray-500 dark:text-gray-400">Inga projekt för denna kund ännu.</p>
      ) : (
       <div className="space-y-3">
        {projects.map((project) => (
         <div
          key={project.id}
          onClick={() => router.push(`/projects/${project.id}`)}
          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
         >
          <div className="flex items-center justify-between">
           <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
            {project.status && (
             <span className={`text-xs px-2 py-1 rounded-full ${
              project.status === 'completed' ? 'bg-green-100 text-green-800' :
              project.status === 'archived' ? 'bg-gray-100 text-gray-800' :
              'bg-blue-100 text-blue-800'
             }`}>
              {project.status}
             </span>
            )}
           </div>
           {project.budgeted_hours && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
             {project.budgeted_hours}h budgeterad
            </div>
           )}
          </div>
         </div>
        ))}
       </div>
      )}
     </div>

     {/* Invoices */}
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Senaste fakturor</h2>
      {invoices.length === 0 ? (
       <p className="text-gray-500 dark:text-gray-400">Inga fakturor för denna kund ännu.</p>
      ) : (
       <div className="overflow-x-auto">
        <table className="w-full text-sm">
         <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
           <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Nummer</th>
           <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Belopp</th>
           <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
           <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Åtgärder</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {invoices.map((invoice) => (
           <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td className="p-4 font-medium text-gray-900 dark:text-white">{invoice.number || invoice.id.slice(0, 8)}</td>
            <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
             {Number(invoice.amount || 0).toLocaleString('sv-SE')} kr
            </td>
            <td className="p-4">
             <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
              invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
             }`}>
              {invoice.status || 'draft'}
             </span>
            </td>
            <td className="p-4 text-right">
             <button
              onClick={() => router.push(`/invoices/${invoice.id}`)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-600 font-semibold text-sm"
             >
              Visa →
             </button>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      )}
     </div>
    </div>
   </main>
  </div>
 )
}

