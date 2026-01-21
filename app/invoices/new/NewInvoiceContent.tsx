'use client'

import { useState, useEffect } from 'react'
import supabase from '@/utils/supabase/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { InvoiceAISuggestion } from '@/components/ai/InvoiceAISuggestion'
import { PillTabs } from '@/components/ui/pill-tabs'
import { FileText, Folder, Sparkles } from 'lucide-react'

export default function NewInvoiceContent() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const initialProjectId = searchParams?.get('projectId')
 const rotApplicationId = searchParams?.get('rotApplicationId')
 const preFilledAmount = searchParams?.get('amount')
 const preFilledClientId = searchParams?.get('clientId')
 const { tenantId } = useTenant()
 
 const [activeTab, setActiveTab] = useState<'manual' | 'project' | 'ai'>(initialProjectId ? 'project' : 'manual')
 const [projectId, setProjectId] = useState<string | null>(initialProjectId)
 const [amount, setAmount] = useState(preFilledAmount ? parseFloat(preFilledAmount) : 0)
 const [desc, setDesc] = useState('')
 const [customer_id, setCustomerId] = useState<string>(preFilledClientId || '')
 const [customer_name, setCustomerName] = useState('')
 const [customer_orgnr, setCustomerOrgnr] = useState('')
 const [clients, setClients] = useState<Array<{ id: string; name: string; org_number?: string }>>([])
 const [projects, setProjects] = useState<Array<{ id: string; name: string; client_id?: string; customer_name?: string }>>([])
 const [loading, setLoading] = useState(false)
 const [loadingProject, setLoadingProject] = useState(!!initialProjectId || !!rotApplicationId)
 const [loadingProjects, setLoadingProjects] = useState(false)
 const [rotApplication, setRotApplication] = useState<any>(null)

 // Fetch clients on mount
 useEffect(() => {
  async function fetchClients() {
   if (!tenantId) {
    console.log('No tenantId, skipping client fetch')
    return
   }

   console.log('Fetching clients for tenant:', tenantId)
   try {
    // Try with org_number first
    const result = await supabase
     .from('clients')
     .select('id, name, org_number')
     .eq('tenant_id', tenantId as string)
     .order('name', { ascending: true })
    
    let clientsData: any = result.data
    let error: any = result.error

    // If org_number column doesn't exist, retry without it
    if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
     const fallback: any = await supabase
      .from('clients')
      .select('id, name')
      .eq('tenant_id', tenantId as string)
      .order('name', { ascending: true })
     
     if (!fallback.error && fallback.data) {
      clientsData = fallback.data.map((c: any) => ({ ...c, org_number: null }))
      error = null
     }
    }

    if (error) {
     console.error('Error fetching clients:', error)
     setClients([])
    } else {
     console.log('Clients fetched:', clientsData?.length || 0)
     setClients(clientsData || [])
    }
   } catch (err) {
    console.error('Unexpected error fetching clients:', err)
    setClients([])
   }
  }

  fetchClients()
 }, [tenantId])

 // Fetch projects on mount
 useEffect(() => {
  async function fetchProjects() {
   if (!tenantId) return

   setLoadingProjects(true)
   try {
    const response = await fetch(`/api/projects/list?tenantId=${tenantId}`)
    if (response.ok) {
     const data = await response.json()
     setProjects(data.projects || [])
    }
   } catch (err) {
    console.error('Error fetching projects:', err)
   } finally {
    setLoadingProjects(false)
   }
  }

  fetchProjects()
 }, [tenantId])

 useEffect(() => {
  async function loadProjectData() {
   if (!projectId || !tenantId) return

   setLoadingProject(true)
   try {
    // Fetch project details with client relation
    const projectResult: any = await supabase
     .from('projects')
     .select('customer_name, base_rate_sek, client_id, clients(id, name, org_number)')
     .eq('id', projectId)
     .eq('tenant_id', tenantId as string)
     .single()
    
    const projectData = projectResult.data
    const projectError = projectResult.error

    if (projectError) {
     console.error('Error fetching project:', projectError)
     toast.error('Kunde inte ladda projektdata')
     return
    }

    if (projectData) {
     // Prefer client from relation if available
     const projectClient = projectData?.clients
     if (projectClient?.id) {
      setCustomerId(projectClient.id)
      setCustomerName(projectClient.name)
      setCustomerOrgnr(projectClient.org_number || '')
     } else if (projectData.client_id) {
      // Fallback to client_id and find in clients list
      setCustomerId(projectData.client_id)
      const client = clients.find(c => c.id === projectData.client_id)
      if (client) {
       setCustomerName(client.name)
       setCustomerOrgnr(client.org_number || '')
      } else {
       // Will be updated when clients list loads
       setCustomerId(projectData.client_id)
      }
     } else {
      // Fallback to customer_name from project
      setCustomerName(projectData.customer_name || '')
     }

     // Fetch unbilled time entries via API route (avoids RLS issues)
     try {
      const response = await fetch(`/api/projects/${projectId}/unbilled-hours`)
      const result = await response.json()

      if (result.success && result.data) {
       const { unbilledHours, totalAmount, timeEntries } = result.data
       const rate = Number(projectData.base_rate_sek) || 360
       setAmount(totalAmount || (unbilledHours * rate))
       setDesc(`${unbilledHours.toFixed(1)} timmar @ ${rate} kr/tim = ${(totalAmount || unbilledHours * rate).toLocaleString('sv-SE')} kr`)
      } else {
       // Fallback to project rate only
       const rate = Number(projectData.base_rate_sek) || 360
       setAmount(0)
       setDesc(`Inga ofakturerade timmar`)
      }
     } catch (apiError: any) {
      console.warn('Error fetching unbilled hours via API:', apiError)
      // Fallback: use project rate only
      const rate = Number(projectData.base_rate_sek) || 360
      setAmount(0)
      setDesc(`Kunde inte ladda timmar`)
     }
    }
   } catch (err) {
    console.error('Error loading project:', err)
   } finally {
    setLoadingProject(false)
   }
  }

  loadProjectData()
 }, [projectId, tenantId])

 // Update customer info when clients list changes and we have a client_id
 useEffect(() => {
      if (customer_id && clients.length > 0) {
       const client = clients.find(c => c.id === customer_id)
       if (client && !customer_name) {
        setCustomerName(client.name)
        setCustomerOrgnr(client.org_number || '')
       }
      }
     }, [clients, customer_id, customer_name])

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setLoading(true)
  
  if (!tenantId) {
   setLoading(false)
   toast.error('Ingen tenant satt. Logga in eller välj tenant först.')
   return
  }

  try {
   // Use API route instead of direct Supabase call for proper tenant verification
   const response = await fetch('/api/invoices/create', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     tenant_id: tenantId,
     project_id: projectId || rotApplication?.project_id || null,
     client_id: customer_id || null,
     customer_name: customer_name || null,
     amount: amount ? Number(amount) : 0,
     desc: desc || null,
     description: desc || null,
     status: 'draft',
     issue_date: new Date().toISOString().split('T')[0],
     rot_application_id: rotApplicationId || null,
    }),
   })

   const result = await response.json()

   if (!response.ok || result.error) {
    console.error('Error creating invoice:', result)
    
    // Show detailed error message
    let errorMessage = result.error || result.details || 'Okänt fel'
    
    if (result.availableTenants && result.availableTenants.length > 0) {
     errorMessage += `\n\nTillgängliga tenants: ${result.availableTenants.map((t: any) => `${t.name} (${t.id})`).join(', ')}`
    }
    
    if (result.suggestion) {
     errorMessage += `\n\n${result.suggestion}`
    }
    
    if (result.diagnostics) {
     errorMessage += `\n\nDiagnostik: Tenant finns: ${result.diagnostics.tenantExists}, Projekt finns: ${result.diagnostics.projectExists}, Kund finns: ${result.diagnostics.clientExists}`
    }
    
    toast.error('Kunde inte skapa faktura: ' + errorMessage)
    setLoading(false)
    return
   }

   const data = result.data

   if (data) {
    // Link ROT application to invoice if applicable
    if (rotApplicationId && data.id) {
     await (supabase
      .from('rot_applications') as any)
      .update({ invoice_id: data.id })
      .eq('id', rotApplicationId)
    }

    // Create invoice lines from unbilled time entries if projectId exists
    if (projectId) {
     try {
      // Fetch unbilled time entries for this project
      const { data: entriesData, error: entriesError } = await supabase
       .from('time_entries')
       .select('id, date, hours_total, ob_type, description, employee_id')
       .eq('project_id', projectId)
       .eq('is_billed', false)
       .eq('tenant_id', tenantId)

      if (!entriesError && entriesData && entriesData.length > 0) {
       // Get project rate
       const projectRateResult: any = await supabase
        .from('projects')
        .select('base_rate_sek')
        .eq('id', projectId)
        .single()

       const rate = Number(projectRateResult.data?.base_rate_sek) || 360

       // Create invoice lines from time entries
       const invoiceLines = entriesData.map((entry: any, index: number) => ({
        invoice_id: data.id,
        tenant_id: tenantId,
        sort_order: index,
        description: entry.description || `Timmar ${new Date(entry.date).toLocaleDateString('sv-SE')}`,
        quantity: Number(entry.hours_total) || 0,
        unit: 'tim',
        rate_sek: rate,
        amount_sek: (Number(entry.hours_total) || 0) * rate,
       }))

       // Insert invoice lines
       const { error: linesError } = await (supabase
        .from('invoice_lines') as any)
        .insert(invoiceLines)

       if (linesError) {
        console.error('Error creating invoice lines:', linesError)
        // Continue anyway - we can still mark entries as billed
       }

       // Mark time entries as billed
       await (supabase
        .from('time_entries') as any)
        .update({ is_billed: true })
        .eq('project_id', projectId)
        .eq('is_billed', false)
        .eq('tenant_id', tenantId)
      }
     } catch (err) {
      console.error('Error creating invoice lines:', err)
      // Continue - invoice is created even if lines fail
     }
    }

    toast.success('Faktura skapad!')
    
    // Dispatch event for invoice creation
    if (typeof window !== 'undefined') {
     window.dispatchEvent(new CustomEvent('invoiceCreated', { 
      detail: { invoiceId: data.id, timestamp: Date.now() }
     }))
     
     const { addNotification } = await import('@/lib/notifications')
     addNotification({
      type: 'success',
      title: 'Faktura skapad',
      message: `Faktura har skapats för ${customer_name || 'kund'}`,
      link: `/invoices/${data.id}`
     })
    }
    
    router.replace(`/invoices/${data.id}`)
   }
  } catch (err: any) {
   console.error('Unexpected error creating invoice:', err)
   toast.error('Ett oväntat fel uppstod: ' + (err.message || 'Okänt fel'))
   setLoading(false)
  }
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
       Ny faktura
      </h1>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
       Skapa en ny faktura manuellt eller med AI-assistans
      </p>
      
      {rotApplication && (
       <div className="mt-4 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
        <p className="text-sm font-semibold text-success-800 dark:text-success-300 mb-2">
         ✓ ROT-ansökan kopplad
        </p>
        <p className="text-xs text-success-700 dark:text-success-400">
         Fakturabeloppet är justerat med ROT-avdrag ({Math.min(rotApplication.work_cost_sek * 0.3, 75000).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}).
        </p>
       </div>
      )}
     </div>

     {/* White Card Container */}
     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Pill Tabs */}
      <PillTabs
       tabs={[
        { id: 'manual', label: 'Manuell', icon: <FileText className="w-4 h-4" /> },
        { id: 'project', label: 'Från projekt', icon: <Folder className="w-4 h-4" /> },
        { id: 'ai', label: 'AI-läsning', icon: <Sparkles className="w-4 h-4" /> },
       ]}
       activeTab={activeTab}
       onChange={(tab) => setActiveTab(tab as any)}
       className="mb-6"
      />

      {loadingProject && (
       <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 dark:border-primary-400 border-t-transparent"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Laddar projektdata...</p>
       </div>
      )}

      {/* AI Tab Content */}
      {activeTab === 'ai' && (
       <div>
        <InvoiceAISuggestion 
         projectId={projectId || undefined} 
         onUseSuggestion={(suggestion) => {
          if (suggestion.totalAmount) {
           setAmount(suggestion.totalAmount);
          }
          if (suggestion.invoiceRows && suggestion.invoiceRows.length > 0) {
           const descParts = suggestion.invoiceRows.map((row: any) => {
            if (row.quantity && row.unitPrice) {
             return `${row.description || 'Arbetstid'}: ${row.quantity} ${row.unit === 'tim' ? 'tim' : ''} @ ${row.unitPrice} kr`;
            }
            return row.description || '';
           });
           setDesc(descParts.join('\n'));
          } else if (suggestion.notes) {
           setDesc(suggestion.notes);
          }
          setActiveTab('manual');
         }}
        />
       </div>
      )}

      {/* Project Tab Content */}
      {activeTab === 'project' && (
       <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
         Välj ett projekt för att automatiskt fylla i fakturainformation baserat på ofakturerade timmar.
        </p>
        
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Välj projekt *
         </label>
         <select
          value={projectId || ''}
          onChange={async (e) => {
           const selectedProjectId = e.target.value
           setProjectId(selectedProjectId || null)
           
           if (selectedProjectId) {
            setLoadingProject(true)
            try {
             // Fetch project details
             const projectResponse = await fetch(`/api/projects/${selectedProjectId}`)
             if (projectResponse.ok) {
              const { project } = await projectResponse.json()
              
              // Set customer info from project
              if (project.clients?.id) {
               setCustomerId(project.clients.id)
               setCustomerName(project.clients.name)
               setCustomerOrgnr(project.clients.org_number || '')
              } else if (project.client_id) {
               setCustomerId(project.client_id)
               const client = clients.find(c => c.id === project.client_id)
               if (client) {
                setCustomerName(client.name)
                setCustomerOrgnr(client.org_number || '')
               }
              } else if (project.customer_name) {
               setCustomerName(project.customer_name)
              }
              
              // Fetch unbilled hours
              const hoursResponse = await fetch(`/api/projects/${selectedProjectId}/unbilled-hours`)
              if (hoursResponse.ok) {
               const result = await hoursResponse.json()
               if (result.success && result.data) {
                const { unbilledHours, totalAmount } = result.data
                const rate = Number(project.base_rate_sek) || 360
                setAmount(totalAmount || (unbilledHours * rate))
                setDesc(`${unbilledHours.toFixed(1)} timmar @ ${rate} kr/tim = ${(totalAmount || unbilledHours * rate).toLocaleString('sv-SE')} kr`)
               } else {
                setAmount(0)
                setDesc('Inga ofakturerade timmar för detta projekt')
               }
              }
             }
            } catch (err) {
             console.error('Error loading project:', err)
             toast.error('Kunde inte ladda projektdata')
            } finally {
             setLoadingProject(false)
            }
           } else {
            // Reset form when no project selected
            setCustomerId('')
            setCustomerName('')
            setCustomerOrgnr('')
            setAmount(0)
            setDesc('')
           }
          }}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
         >
          <option value="">Välj projekt...</option>
          {projects.map((project) => (
           <option key={project.id} value={project.id}>
            {project.name} {project.customer_name ? `(${project.customer_name})` : ''}
           </option>
          ))}
         </select>
         {loadingProjects && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Laddar projekt...</p>
         )}
         {!loadingProjects && projects.length === 0 && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
           Inga projekt hittades. <a href="/projects/new" className="text-primary-500 dark:text-primary-400 hover:underline">Skapa projekt</a>
          </p>
         )}
        </div>
        
        {projectId && amount > 0 && (
         <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
          <p className="text-sm font-semibold text-success-800 dark:text-success-300 mb-2">
           ✓ Projektdata laddad
          </p>
          <p className="text-sm text-success-700 dark:text-success-400">
           Kund: {customer_name || 'Ej angiven'}
           <br />
           Belopp: {amount.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}
          </p>
          <button
           type="button"
           onClick={() => setActiveTab('manual')}
           className="mt-3 text-sm font-medium text-success-600 dark:text-success-400 hover:underline"
          >
           Gå vidare till manuell redigering →
          </button>
         </div>
        )}
        
        {projectId && amount === 0 && !loadingProject && (
         <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
           Det finns inga ofakturerade timmar för detta projekt. Du kan fortfarande skapa en manuell faktura.
          </p>
         </div>
        )}
       </div>
      )}

      {/* Manual Tab Content - Form */}
      {activeTab === 'manual' && (
       <form onSubmit={handleSubmit} className="space-y-6">
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Kund *
         </label>
         <select
          value={customer_id}
          onChange={(e) => {
           const selectedClientId = e.target.value
           setCustomerId(selectedClientId)
           const selectedClient = clients.find(c => c.id === selectedClientId)
           if (selectedClient) {
            setCustomerName(selectedClient.name)
            setCustomerOrgnr(selectedClient.org_number || '')
           } else {
            setCustomerName('')
            setCustomerOrgnr('')
           }
          }}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
           Inga kunder hittades. <a href="/clients/new" className="text-primary-500 dark:text-primary-400 hover:underline">Lägg till kund</a>
          </p>
         )}
        </div>

        {customer_id && (
         <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <p className="text-sm text-primary-800 dark:text-primary-200">
           <strong>Vald kund:</strong> {customer_name}
           {customer_orgnr && ` (Org.nr: ${customer_orgnr})`}
          </p>
         </div>
        )}

        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Belopp (SEK) *
         </label>
         <input
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          placeholder="0"
          required
          min="0"
          step="0.01"
         />
        </div>

        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Beskrivning *
         </label>
         <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[120px] resize-none transition-all"
          placeholder="Beskrivning av fakturerad tjänst"
          required
         />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
         <button
          type="submit"
          disabled={loading || loadingProject}
          className="w-full sm:flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg py-3 font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         >
          {loading ? (
           <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            Sparar...
           </span>
          ) : (
           'Skapa faktura'
          )}
         </button>
         <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
         >
          Avbryt
         </button>
        </div>
       </form>
      )}
     </div>
    </div>
   </main>
  </div>
 )
}

