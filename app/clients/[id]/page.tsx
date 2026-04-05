'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'
import { Edit2, Archive, Briefcase, Clock, DollarSign, FileText, Plus, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { ExportToIntegrationButton } from '@/components/integrations/ExportToIntegrationButton'
import { apiFetch } from '@/lib/http/fetcher'
import { BASE_PATH } from '@/utils/url'
import DetailLayout from '@/components/DetailLayout'
import { StatCard } from '@/components/cards/StatCard'

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
  return <DetailLayout title="Laddar..." tabs={[]} loading={true} />
 }

 if (!client) {
  return <DetailLayout title="Kunden hittades inte" tabs={[]} error="Kunden hittades inte" onBack={() => router.push('/clients')} />
 }

 const tabs = [
  {
   id: 'overview',
   label: 'Översikt',
   content: (
    <div className="space-y-6">
     {/* Stats Cards */}
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <StatCard 
       icon={<Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />} 
       value={projects.length} 
       label="Projekt" 
       iconColor="blue"
      />
      <StatCard 
       icon={<Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />} 
       value={totalHours.toFixed(1) + 'h'} 
       label="Totala timmar" 
       iconColor="blue"
      />
      <StatCard 
       icon={<DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />} 
       value={totalRevenue.toLocaleString('sv-SE') + ' kr'} 
       label="Omsättning" 
       iconColor="green"
      />
     </div>

     {/* Client Info */}
     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kontaktinformation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
       {client.org_number && (
        <div className="flex items-start gap-3">
         <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
         </div>
         <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Organisationsnummer</p>
          <p className="font-medium text-gray-900 dark:text-white">{client.org_number}</p>
         </div>
        </div>
       )}
       {client.email && (
        <div className="flex items-start gap-3">
         <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Mail className="w-4 h-4 text-blue-500 dark:text-blue-400" />
         </div>
         <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">E-post</p>
          <a href={`mailto:${client.email}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
           {client.email}
          </a>
         </div>
        </div>
       )}
       {client.phone && (
        <div className="flex items-start gap-3">
         <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Phone className="w-4 h-4 text-green-500 dark:text-green-400" />
         </div>
         <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Telefon</p>
          <a href={`tel:${client.phone}`} className="font-medium text-gray-900 dark:text-white hover:underline">
           {client.phone}
          </a>
         </div>
        </div>
       )}
       {client.address && (
        <div className="flex items-start gap-3">
         <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
         </div>
         <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Adress</p>
          <p className="font-medium text-gray-900 dark:text-white">{client.address}</p>
         </div>
        </div>
       )}
       {client.created_at && (
        <div className="flex items-start gap-3">
         <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
         </div>
         <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Skapad</p>
          <p className="font-medium text-gray-900 dark:text-white">
           {new Date(client.created_at).toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
           })}
          </p>
         </div>
        </div>
       )}
      </div>
     </div>
    </div>
   )
  },
  {
   id: 'projects',
   label: 'Projekt',
   content: (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
     <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 className="font-semibold text-gray-900 dark:text-white">Alla projekt</h3>
      <button
       onClick={() => router.push(`/projects/new?clientId=${clientId}`)}
       className="text-sm px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-md font-medium transition-colors flex items-center gap-1"
      >
       <Plus className="w-4 h-4" /> Nytt projekt
      </button>
     </div>
     {projects.length === 0 ? (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
       Inga projekt hittades.
      </div>
     ) : (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
       {projects.map((project) => (
        <div
         key={project.id}
         onClick={() => router.push(`/projects/${project.id}`)}
         className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer flex items-center justify-between"
        >
         <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
          <div className="flex items-center gap-2 mt-1">
           {project.status && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
             project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
             project.status === 'archived' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
             'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            }`}>
             {project.status}
            </span>
           )}
          </div>
         </div>
         {project.budgeted_hours && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
           {project.budgeted_hours}h budget
          </div>
         )}
        </div>
       ))}
      </div>
     )}
    </div>
   )
  },
  {
   id: 'invoices',
   label: 'Fakturor',
   content: (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
     <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white">Fakturahistorik</h3>
     </div>
     {invoices.length === 0 ? (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
       Inga fakturor hittades.
      </div>
     ) : (
      <div className="overflow-x-auto">
       <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
         <tr>
          <th className="p-4">Nummer</th>
          <th className="p-4 text-right">Belopp</th>
          <th className="p-4">Status</th>
          <th className="p-4 text-right">Datum</th>
          <th className="p-4"></th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
         {invoices.map((invoice) => (
          <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
           <td className="p-4 font-medium text-gray-900 dark:text-white">
            {invoice.number || invoice.id.slice(0, 8)}
           </td>
           <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
            {Number(invoice.amount || 0).toLocaleString('sv-SE')} kr
           </td>
           <td className="p-4">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
             invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
             invoice.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
             'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}>
             {invoice.status || 'draft'}
            </span>
           </td>
           <td className="p-4 text-right text-gray-500 dark:text-gray-400">
            {invoice.issue_date || '-'}
           </td>
           <td className="p-4 text-right">
            <button
             onClick={() => router.push(`/invoices/${invoice.id}`)}
             className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
            >
             Visa
            </button>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     )}
    </div>
   )
  }
 ]

 return (
  <DetailLayout
   title={client.name}
   subtitle="Kundinformation"
   onBack={() => router.push('/clients')}
   tabs={tabs}
   actions={isAdmin ? (
    <>
     <button
      onClick={() => router.push(`/clients/${clientId}/edit`)}
      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
     >
      <Edit2 className="w-4 h-4" /> Redigera
     </button>
     <ExportToIntegrationButton
      type="customer"
      resourceId={client.id}
      resourceName={client.name}
      variant="button"
     />
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
      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2"
     >
      <Archive className="w-4 h-4" /> Arkivera
     </button>
    </>
   ) : undefined}
  />
 )
}

