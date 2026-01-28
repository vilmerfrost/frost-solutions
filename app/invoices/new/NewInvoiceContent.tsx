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
import { BASE_PATH } from '@/utils/url'
import { apiFetch } from '@/lib/http/fetcher'

type InvoiceType = 'STANDARD' | 'FINAL' | 'PARTIAL'
type VatRate = 25 | 12 | 6
type PaymentTerms = 'NETTO_14' | 'NETTO_30' | 'NETTO_45' | 'IMMEDIATE'

const INVOICE_TYPES: { value: InvoiceType; label: string }[] = [
 { value: 'STANDARD', label: 'Standardfaktura' },
 { value: 'FINAL', label: 'Slutfaktura' },
 { value: 'PARTIAL', label: 'Delfaktura' },
]

const VAT_RATES: { value: VatRate; label: string }[] = [
 { value: 25, label: '25% (standard)' },
 { value: 12, label: '12% (livsmedel/hotell)' },
 { value: 6, label: '6% (böcker/kultur)' },
]

const PAYMENT_TERMS: { value: PaymentTerms; label: string; days: number }[] = [
 { value: 'NETTO_14', label: 'Netto 14 dagar', days: 14 },
 { value: 'NETTO_30', label: 'Netto 30 dagar', days: 30 },
 { value: 'NETTO_45', label: 'Netto 45 dagar', days: 45 },
 { value: 'IMMEDIATE', label: 'Omedelbar betalning', days: 0 },
]

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
 const [projectRotInfo, setProjectRotInfo] = useState<{
  is_rot_rut: boolean
  property_designation?: string
  apartment_number?: string
  price_model?: string
  markup_percent?: number
 } | null>(null)

 // New enhanced fields
 const [invoiceType, setInvoiceType] = useState<InvoiceType>('STANDARD')
 const [periodFrom, setPeriodFrom] = useState('')
 const [periodTo, setPeriodTo] = useState('')
 const [vatRate, setVatRate] = useState<VatRate>(25)
 const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('NETTO_30')
 const [ocrNumber, setOcrNumber] = useState('')
 const [notesToCustomer, setNotesToCustomer] = useState('')
 const [sendByEmail, setSendByEmail] = useState(true)
 const [sendByMail, setSendByMail] = useState(false)

 // Calculate derived values
 const vatAmount = amount * (vatRate / 100)
 const totalIncludingVat = amount + vatAmount
 const dueDate = (() => {
  const days = PAYMENT_TERMS.find(t => t.value === paymentTerms)?.days || 30
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
 })()

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
    const data = await apiFetch<{ projects?: any[] }>(`/api/projects/list?tenantId=${tenantId}`)
    setProjects(data.projects || [])
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
     .select('customer_name, base_rate_sek, client_id, is_rot_rut, property_designation, apartment_number, price_model, markup_percent, clients(id, name, org_number)')
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
     // Store ROT/RUT info from project
     if (projectData.is_rot_rut) {
      setProjectRotInfo({
       is_rot_rut: true,
       property_designation: projectData.property_designation,
       apartment_number: projectData.apartment_number,
       price_model: projectData.price_model,
       markup_percent: projectData.markup_percent,
      })
     } else {
      setProjectRotInfo(null)
     }

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
      const result = await apiFetch<{ success?: boolean; data?: { unbilledHours: number; totalAmount: number; timeEntries?: any[] } }>(`/api/projects/${projectId}/unbilled-hours`)

      if (result.success && result.data) {
       const { unbilledHours, totalAmount } = result.data
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
   let result: any
   try {
    result = await apiFetch<{ data?: { id?: string }; error?: string; details?: string; availableTenants?: any[]; suggestion?: string; diagnostics?: any }>('/api/invoices/create', {
     method: 'POST',
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
      // Enhanced fields
      invoice_type: invoiceType,
      period_from: periodFrom || null,
      period_to: periodTo || null,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_including_vat: totalIncludingVat,
      payment_terms: paymentTerms,
      due_date: dueDate,
      ocr_number: ocrNumber || null,
      notes_to_customer: notesToCustomer || null,
      send_by_email: sendByEmail,
      send_by_mail: sendByMail,
     }),
    })
   } catch (apiErr: any) {
    console.error('Error creating invoice:', apiErr)
    toast.error('Kunde inte skapa faktura: ' + (apiErr.message || 'Okänt fel'))
    setLoading(false)
    return
   }

   if (result.error) {
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

      {/* Show project ROT info */}
      {projectRotInfo?.is_rot_rut && !rotApplication && (
       <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
         ROT-projekt
        </p>
        <p className="text-xs text-green-700 dark:text-green-400">
         Detta projekt är markerat för ROT-avdrag.
         {projectRotInfo.property_designation && (
          <span className="block mt-1">Fastighetsbeteckning: <strong>{projectRotInfo.property_designation}</strong></span>
         )}
         {projectRotInfo.apartment_number && (
          <span className="block">Lägenhetsnummer: <strong>{projectRotInfo.apartment_number}</strong></span>
         )}
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
             const { project } = await apiFetch<{ project?: any }>(`/api/projects/${selectedProjectId}`)
             
             if (project) {
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
              try {
               const result = await apiFetch<{ success?: boolean; data?: { unbilledHours: number; totalAmount: number } }>(`/api/projects/${selectedProjectId}/unbilled-hours`)
               if (result.success && result.data) {
                const { unbilledHours, totalAmount } = result.data
                const rate = Number(project.base_rate_sek) || 360
                setAmount(totalAmount || (unbilledHours * rate))
                setDesc(`${unbilledHours.toFixed(1)} timmar @ ${rate} kr/tim = ${(totalAmount || unbilledHours * rate).toLocaleString('sv-SE')} kr`)
               } else {
                setAmount(0)
                setDesc('Inga ofakturerade timmar för detta projekt')
               }
              } catch (hoursErr) {
               console.warn('Error fetching unbilled hours:', hoursErr)
               setAmount(0)
               setDesc('Inga ofakturerade timmar för detta projekt')
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
           Inga projekt hittades. <a href={`${BASE_PATH}/projects/new`} className="text-primary-500 dark:text-primary-400 hover:underline">Skapa projekt</a>
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
        {/* Invoice Type */}
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Fakturatyp *
         </label>
         <div className="flex flex-wrap gap-2">
          {INVOICE_TYPES.map((type) => (
           <button
            key={type.value}
            type="button"
            onClick={() => setInvoiceType(type.value)}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
             invoiceType === type.value
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
           >
            {type.label}
           </button>
          ))}
         </div>
        </div>

        {/* Customer */}
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
           Inga kunder hittades. <a href={`${BASE_PATH}/clients/new`} className="text-primary-500 dark:text-primary-400 hover:underline">Lägg till kund</a>
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

        {/* Period */}
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Faktureringsperiod
         </label>
         <div className="grid grid-cols-2 gap-3">
          <div>
           <label className="block text-xs text-gray-500 mb-1">Från</label>
           <input
            type="date"
            value={periodFrom}
            onChange={(e) => setPeriodFrom(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           />
          </div>
          <div>
           <label className="block text-xs text-gray-500 mb-1">Till</label>
           <input
            type="date"
            value={periodTo}
            onChange={(e) => setPeriodTo(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           />
          </div>
         </div>
        </div>

        {/* Amount and VAT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Belopp exkl. moms (SEK) *
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
           Momssats *
          </label>
          <select
           value={vatRate}
           onChange={(e) => setVatRate(Number(e.target.value) as VatRate)}
           className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
           {VAT_RATES.map((rate) => (
            <option key={rate.value} value={rate.value}>{rate.label}</option>
           ))}
          </select>
         </div>
        </div>

        {/* Totals display */}
        {amount > 0 && (
         <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm mb-2">
           <span className="text-gray-600 dark:text-gray-400">Belopp exkl. moms:</span>
           <span className="font-medium text-gray-900 dark:text-white">{amount.toLocaleString('sv-SE')} kr</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
           <span className="text-gray-600 dark:text-gray-400">Moms ({vatRate}%):</span>
           <span className="font-medium text-gray-900 dark:text-white">{vatAmount.toLocaleString('sv-SE')} kr</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-600">
           <span className="text-gray-900 dark:text-white">TOTALT:</span>
           <span className="text-primary-600 dark:text-primary-400">{totalIncludingVat.toLocaleString('sv-SE')} kr</span>
          </div>
         </div>
        )}

        {/* Description */}
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Beskrivning *
         </label>
         <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px] resize-none transition-all"
          placeholder="Beskrivning av fakturerad tjänst"
          required
         />
        </div>

        {/* Payment Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Betalningsvillkor *
          </label>
          <select
           value={paymentTerms}
           onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
           className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
           {PAYMENT_TERMS.map((term) => (
            <option key={term.value} value={term.value}>{term.label}</option>
           ))}
          </select>
         </div>
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Förfallodatum
          </label>
          <input
           type="text"
           value={dueDate}
           disabled
           className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
          />
         </div>
        </div>

        {/* OCR Number */}
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          OCR-nummer
         </label>
         <input
          type="text"
          value={ocrNumber}
          onChange={(e) => setOcrNumber(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="Genereras automatiskt om tomt"
         />
        </div>

        {/* Notes to Customer */}
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Anteckningar till kund
         </label>
         <textarea
          value={notesToCustomer}
          onChange={(e) => setNotesToCustomer(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-none"
          placeholder="Visas på fakturan..."
         />
        </div>

        {/* Send Method */}
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Skickningsmetod
         </label>
         <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
           <input
            type="checkbox"
            checked={sendByEmail}
            onChange={(e) => setSendByEmail(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
           />
           <span className="text-gray-700 dark:text-gray-300">E-post</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
           <input
            type="checkbox"
            checked={sendByMail}
            onChange={(e) => setSendByMail(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
           />
           <span className="text-gray-700 dark:text-gray-300">Brev</span>
          </label>
         </div>
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

