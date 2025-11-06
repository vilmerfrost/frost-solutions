'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import AISummary from '@/components/AISummary'
import FileUpload from '@/components/FileUpload'
import FileList from '@/components/FileList'
import DidYouKnow from '@/components/DidYouKnow'
import ATA2Card from '@/components/ATA2Card'
import BudgetCard from '@/components/BudgetCard'
import { ScheduleCalendar } from '@/components/scheduling/ScheduleCalendar'
import { useProject, useProjectHours } from '@/hooks/useProjects'
import { useAdmin } from '@/hooks/useAdmin'
import { ExportToIntegrationButton } from '@/components/integrations/ExportToIntegrationButton'
import { Sparkles } from 'lucide-react'
import { BudgetAIPrediction } from '@/components/ai/BudgetAIPrediction'
import { MaterialAIIdentifier } from '@/components/ai/MaterialAIIdentifier'
import { ProjectAIPlanning } from '@/components/ai/ProjectAIPlanning'
import { ProjectAnalytics } from '@/components/analytics/ProjectAnalytics'

type ProjectRecord = {
  id: string
  name: string
  customer_name?: string | null
  customer_orgnr?: string | null
  base_rate_sek?: number | null
  budgeted_hours?: number | null
  status?: string | null
  client_id?: string | null
  tenant_id?: string | null
  clients?: {
    id: string
    name: string
    org_number?: string | null
  } | null
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { tenantId } = useTenant()

  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [hours, setHours] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [employeeHours, setEmployeeHours] = useState<any[]>([])
  const [showEmployeeHours, setShowEmployeeHours] = useState(false)
  const [loadingEmployeeHours, setLoadingEmployeeHours] = useState(false)
  const { isAdmin, loading: adminLoading } = useAdmin()

  const projectId = params?.id as string | undefined

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      setError('Ingen projekt-ID angiven')
      return
    }

    // Wait a bit for tenantId to load
    if (!tenantId) {
      console.log('⏳ Waiting for tenantId...')
      // Don't set error yet, just wait
      return
    }

    let cancelled = false

    async function load() {
      console.log('🔄 Project page: load() called', { projectId, tenantId, refreshTrigger })
      setLoading(true)
      setError(null)
      setHours(0)

      try {
        if (cancelled) return
        
        console.log('🔍 Loading project:', { projectId, tenantId })
        
        // Fetch project - try multiple approaches
        // First: try with full client join
        let { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*, clients(id, name, org_number), client_id')
          .eq('id', projectId)
          .eq('tenant_id', tenantId)
          .maybeSingle()
        
        // If error about org_number, retry without it
        if (projectError && projectError.message?.includes('org_number')) {
          console.log('⚠️ Retrying without org_number')
          const retry = await supabase
            .from('projects')
            .select('*, clients(id, name), client_id')
            .eq('id', projectId)
            .eq('tenant_id', tenantId)
            .maybeSingle()
          
          if (!retry.error && retry.data) {
            projectData = retry.data
            projectError = null
          } else {
            projectError = retry.error
          }
        }
        
        // If still error and it's a "not found" error, try without tenant filter (might be RLS issue)
        if (projectError && (projectError.code === 'PGRST116' || projectError.message?.includes('No rows'))) {
          console.log('⚠️ Project not found with tenant filter, trying without tenant check')
          const retryNoTenant = await supabase
            .from('projects')
            .select('*, clients(id, name), client_id')
            .eq('id', projectId)
            .maybeSingle()
          
          if (!retryNoTenant.error && retryNoTenant.data) {
            // Verify tenant matches manually
            if (retryNoTenant.data.tenant_id === tenantId) {
              projectData = retryNoTenant.data
              projectError = null
            } else {
              projectError = { message: 'Projektet tillhör en annan tenant' } as any
            }
          }
        }

        if (cancelled) return

        if (projectError || !projectData) {
          console.error('❌ Failed to fetch project', {
            error: projectError,
            projectId,
            tenantId,
          })
          setError('Kunde inte hämta projekt: ' + (projectError?.message || 'Okänt fel'))
          setLoading(false)
          return
        }
        
        console.log('✅ Project loaded:', projectData.name)
        console.log('📋 Project client info:', {
          client_id: (projectData as any).client_id,
          clients: (projectData as any).clients,
          customer_name: (projectData as any).customer_name
        })

        // Ensure we preserve client_id and clients relation
        setProject({
          ...(projectData as ProjectRecord),
          client_id: (projectData as any).client_id || null,
          clients: (projectData as any).clients || null,
        } as ProjectRecord)

          // Hämta ofakturerade timmar och time entries för AI summary via API route
        try {
          console.log('📊 Project page: Fetching project hours from API...')
          const hoursResponse = await fetch(`/api/projects/${projectId}/hours?projectId=${projectId}&_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          })
          
          if (hoursResponse.ok) {
            const hoursData = await hoursResponse.json()
            console.log('✅ Project page: Hours fetched:', hoursData)
            setHours(hoursData.hours || 0)
            setTimeEntries(hoursData.entries || [])
          } else {
            const errorText = await hoursResponse.text()
            console.warn('❌ Failed to fetch project hours from API:', errorText)
            // Fallback to direct query - filter by employee if not admin
            const { data: { user } } = await supabase.auth.getUser()
            let employeeIdForFilter: string | null = null
            let isAdminForFilter = false
            
            if (user) {
              const { data: empData } = await supabase
                .from('employees')
                .select('id, role')
                .eq('auth_user_id', user.id)
                .eq('tenant_id', tenantId)
                .maybeSingle()
              
              if (empData) {
                isAdminForFilter = empData.role === 'admin' || empData.role === 'Admin' || empData.role === 'ADMIN'
                if (!isAdminForFilter) {
                  employeeIdForFilter = empData.id
                }
              }
            }
            
            let entryQuery = supabase
              .from('time_entries')
              .select('hours_total, date, ob_type')
              .eq('project_id', projectId)
              .eq('is_billed', false)
              .eq('tenant_id', tenantId)
            
            if (!isAdminForFilter && employeeIdForFilter) {
              entryQuery = entryQuery.eq('employee_id', employeeIdForFilter)
            }
            
            const { data: entryRows, error: entriesErr } = await entryQuery
              .order('date', { ascending: false })
              .limit(50)

            if (entriesErr) {
              console.warn('Failed to fetch time entries', entriesErr)
              setHours(0)
              setTimeEntries([])
            } else {
              const totalHours = (entryRows ?? []).reduce((sum: number, row: any) => {
                return sum + Number(row?.hours_total ?? 0)
              }, 0)
              setHours(totalHours)
              setTimeEntries(entryRows || [])
            }
          }
        } catch (hoursErr) {
          console.warn('Error fetching project hours:', hoursErr)
          setHours(0)
          setTimeEntries([])
        }

        if (cancelled) return
        setLoading(false)
      } catch (err: any) {
        if (cancelled) return
        console.error('Unexpected error', err)
        setError('Ett fel uppstod när projektet skulle hämtas.')
        setLoading(false)
      }
    }

    load()
    
    return () => {
      cancelled = true
    }
  }, [projectId, tenantId, refreshTrigger])

  // Separate useEffect for event listener registration (runs once on mount)
  useEffect(() => {
    if (!projectId) return

    // Listen for time entry updates (from TimeClock checkout)
    const handleTimeEntryUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('🔄 Project page: Time entry updated event received!', customEvent.detail)
      
      // Check if this event is for this project (if projectId is in detail)
      const eventProjectId = customEvent.detail?.projectId
      if (eventProjectId && eventProjectId !== projectId) {
        console.log('⏭️ Project page: Event is for different project, skipping', { eventProjectId, currentProjectId: projectId })
        return
      }
      
      // Small delay to ensure database has committed the changes
      setTimeout(() => {
        console.log('⏰ Project page: Triggering refresh...')
        setRefreshTrigger(prev => {
          const newValue = prev + 1
          console.log('✅ Project page: Refresh trigger updated:', newValue)
          return newValue
        })
      }, 500) // Increased delay to ensure DB commit
    }
    
    // Also listen for localStorage updates (fallback)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'timeEntryUpdated' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          console.log('🔄 Project page: localStorage update received!', data)
          if (data.projectId === projectId || !data.projectId) {
            setTimeout(() => {
              setRefreshTrigger(prev => prev + 1)
            }, 500)
          }
        } catch (err) {
          console.error('Error parsing storage event:', err)
        }
      }
    }
    
    // Set up event listener on both window and document for maximum compatibility
    if (typeof window !== 'undefined') {
      window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
      document.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
      document.body?.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
      window.addEventListener('storage', handleStorageChange)
      console.log('✅ Project page: Event listeners registered for timeEntryUpdated on window, document, and body')
      
      // Also check if there's a pending update in localStorage
      const pendingUpdate = localStorage.getItem('timeEntryUpdated')
      if (pendingUpdate) {
        try {
          const data = JSON.parse(pendingUpdate)
          if (data.projectId === projectId || !data.projectId) {
            console.log('🔄 Project page: Found pending update in localStorage, triggering refresh')
            setTimeout(() => {
              setRefreshTrigger(prev => prev + 1)
            }, 500)
          }
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
        console.log('🔌 Project page: Event listeners removed')
      }
    }
  }, [projectId]) // Only re-run when projectId changes, not on refreshTrigger

  async function handleSendInvoice() {
    if (!isAdmin) {
      toast.error('Endast administratörer kan skicka fakturor. Kontakta en administratör för att begära fakturering.')
      return
    }
    
    if (!projectId || !tenantId) {
      toast.error('Saknade data för att skapa faktura')
      return
    }
    
    try {
      // Hämta ofakturerade timmar först
      const { data: entries } = await supabase
        .from('time_entries')
        .select('hours_total')
        .eq('project_id', projectId)
        .eq('is_billed', false)
        .eq('tenant_id', tenantId)

      const totalHours = (entries ?? []).reduce((sum: number, row: any) => {
        return sum + Number(row?.hours_total ?? 0)
      }, 0)

      if (totalHours === 0) {
        toast.error('Inga ofakturerade timmar att skicka faktura för.')
        return
      }

      const rate = Number(project?.base_rate_sek ?? 0) || 360
      const amount = totalHours * rate

      // Get client_id from project - fetch fresh data to ensure we have client info
      let clientId: string | null = null
      let clientName: string = 'Okänd kund'
      
      // First try from current project state
      if (project?.client_id) {
        clientId = project.client_id
      } else if (project?.clients?.id) {
        clientId = project.clients.id
        clientName = project.clients.name || project?.customer_name || 'Okänd kund'
      } else if (project?.customer_name) {
        clientName = project.customer_name
      }
      
      // If we don't have client_id, fetch project again to get it
      if (!clientId && projectId) {
        try {
          const { data: projectData } = await supabase
            .from('projects')
            .select('client_id, clients(id, name), customer_name')
            .eq('id', projectId)
            .eq('tenant_id', tenantId)
            .single()
          
          if (projectData) {
            clientId = projectData.client_id || (projectData as any)?.clients?.id || null
            clientName = (projectData as any)?.clients?.name || projectData.customer_name || 'Okänd kund'
          }
        } catch (err) {
          console.warn('Could not fetch client info from project:', err)
        }
      }
      
      console.log('📝 Invoice creation - Client info:', { clientId, clientName, projectId })
      
      // Create invoice via API route (invoice lines will be created automatically from time entries)
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          project_id: projectId, // This triggers automatic invoice line creation
          client_id: clientId,
          customer_name: clientName,
          amount, // Initial amount, will be recalculated from invoice lines
          desc: `${totalHours.toFixed(1)} timmar @ ${rate} kr/tim`,
          description: `${totalHours.toFixed(1)} timmar @ ${rate} kr/tim`,
          status: 'sent',
          issue_date: new Date().toISOString().split('T')[0],
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        console.error('❌ Error creating invoice:', result)
        
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
        return
      }

      const invoice = result.data

      // Check if there was a warning about invoice lines
      if (result.warning) {
        console.warn('⚠️ Warning:', result.warning)
        toast.error(`Faktura skapad men kunde inte skapa invoice lines: ${result.error || 'Okänt fel'}`)
      } else {
        toast.success('Faktura skapad! Granska och godkänn den på fakturasidan för att markera time entries som fakturerade.')
      }

      // DO NOT mark time entries as billed here - they will be marked when invoice is approved
      // Time entries are copied to invoice lines and can be reviewed/approved on the invoice page

      router.push(`/invoices/${invoice.id}`)
    } catch (err: any) {
      toast.error('Fel: ' + err.message)
    }
  }

  async function handleDownloadPDF() {
    if (!isAdmin) {
      toast.error('Endast administratörer kan skapa fakturor. Kontakta en administratör för att begära fakturering.')
      return
    }
    
    if (!projectId || !tenantId) {
      toast.error('Saknade data för att skapa faktura')
      return
    }
    
    try {
      // Skapa faktura först om den inte finns
      const { data: entries } = await supabase
        .from('time_entries')
        .select('hours_total')
        .eq('project_id', projectId)
        .eq('is_billed', false)
        .eq('tenant_id', tenantId)

      const totalHours = (entries ?? []).reduce((sum: number, row: any) => {
        return sum + Number(row?.hours_total ?? 0)
      }, 0)

      if (totalHours === 0) {
        toast.error('Inga ofakturerade timmar att fakturera.')
        return
      }

      const rate = Number(project?.base_rate_sek ?? 0) || 360
      const amount = totalHours * rate

      // Get client_id from project - fetch fresh data to ensure we have client info
      let clientId: string | null = null
      let clientName: string = 'Okänd kund'
      
      // First try from current project state
      if (project?.client_id) {
        clientId = project.client_id
      } else if (project?.clients?.id) {
        clientId = project.clients.id
        clientName = project.clients.name || project?.customer_name || 'Okänd kund'
      } else if (project?.customer_name) {
        clientName = project.customer_name
      }
      
      // If we don't have client_id, fetch project again to get it
      if (!clientId && projectId) {
        try {
          const { data: projectData } = await supabase
            .from('projects')
            .select('client_id, clients(id, name), customer_name')
            .eq('id', projectId)
            .eq('tenant_id', tenantId)
            .single()
          
          if (projectData) {
            clientId = projectData.client_id || (projectData as any)?.clients?.id || null
            clientName = (projectData as any)?.clients?.name || projectData.customer_name || 'Okänd kund'
          }
        } catch (err) {
          console.warn('Could not fetch client info from project:', err)
        }
      }
      
      console.log('📝 PDF Invoice creation - Client info:', { clientId, clientName, projectId })
      
      // Create invoice via API route (invoice lines will be created automatically from time entries)
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          project_id: projectId, // This triggers automatic invoice line creation
          client_id: clientId,
          customer_name: clientName,
          amount, // Initial amount, will be recalculated from invoice lines
          desc: `${totalHours.toFixed(1)} timmar @ ${rate} kr/tim`,
          description: `${totalHours.toFixed(1)} timmar @ ${rate} kr/tim`,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
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
        return
      }

      // Ladda ner PDF
      window.open(`/api/invoices/${result.data.id}?download=true`, '_blank')
      toast.success('PDF laddas ner...')
    } catch (err: any) {
      toast.error('Fel: ' + err.message)
    }
  }

  if (loading || !tenantId) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full flex items-center justify-center p-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">
              {!tenantId ? 'Laddar tenant-information...' : 'Laddar projekt...'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full flex items-center justify-center p-10">
          <div className="text-center max-w-md">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error ?? 'Projektet hittas inte!'}</p>
            <button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Tillbaka
            </button>
          </div>
        </main>
      </div>
    )
  }

  const effectiveHours = Number.isFinite(hours) ? hours : 0
  const rate = Number(project.base_rate_sek ?? 0) || 360
  const sum = effectiveHours * rate
  const budget = Number(project.budgeted_hours ?? 0)
  const progress = budget > 0 ? Math.min((effectiveHours / budget) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 transition-colors"
            >
              ← Tillbaka
            </button>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">{project.name}</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {(project as any)?.clients?.name || project.customer_name || 'Ingen kund angiven'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Rapporterade timmar</div>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{effectiveHours.toFixed(1)}h</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Timpris</div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{rate.toLocaleString('sv-SE')} kr</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Ofakturerat</div>
              <div className="text-2xl sm:text-3xl font-black text-pink-600 dark:text-pink-400">{sum.toLocaleString('sv-SE')} kr</div>
            </div>
            {budget > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Budget</div>
                <div className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">{budget}h</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {budget > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Budgetprogression</span>
                <span className="font-bold">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${
                    progress >= 90 ? 'from-red-500 to-red-600' :
                    progress >= 70 ? 'from-orange-500 to-orange-600' :
                    'from-blue-500 via-purple-500 to-pink-500'
                  } rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* AI-stöd Export-knapp */}
          {project && (
            <div className="mb-6 sm:mb-8">
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      Vill du exportera detta projekt?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Exportera projektdata till Fortnox eller Visma för enkel fakturering och bokföring.
                    </p>
                  </div>
                  <ExportToIntegrationButton
                    type="project"
                    resourceId={project.id}
                    resourceName={project.name}
                    variant="button"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Did You Know */}
          <DidYouKnow />

          {/* ÄTA 2.0 Section */}
          {project && (
            <div className="mb-6 sm:mb-8">
              <ATA2Card projectId={project.id} tenantId={project.tenant_id || tenantId || ''} />
            </div>
          )}

          {/* Budget & Alerts Section */}
          {project && (
            <div className="mb-6 sm:mb-8">
              <BudgetCard projectId={project.id} tenantId={project.tenant_id || tenantId || ''} />
            </div>
          )}

          {/* Schedule Calendar Section */}
          {project && (
            <div className="mb-6 sm:mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Schema för projektet
                </h2>
                <ScheduleCalendar projectId={project.id} />
              </div>
            </div>
          )}

          {/* Employee Hours Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Anställdas timmar
              </h2>
              <button
                onClick={async () => {
                  if (!showEmployeeHours && employeeHours.length === 0) {
                    setLoadingEmployeeHours(true)
                    try {
                      const response = await fetch(`/api/projects/${projectId}/employee-hours?projectId=${projectId}`)
                      if (response.ok) {
                        const data = await response.json()
                        setEmployeeHours(data.employees || [])
                      }
                    } catch (err) {
                      console.error('Error fetching employee hours:', err)
                    } finally {
                      setLoadingEmployeeHours(false)
                    }
                  }
                  setShowEmployeeHours(!showEmployeeHours)
                }}
                className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {loadingEmployeeHours ? 'Laddar...' : showEmployeeHours ? 'Dölj' : 'Visa'}
              </button>
            </div>
            
            {showEmployeeHours && (
              <div className="space-y-3">
                {employeeHours.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Inga tidsrapporter registrerade ännu.
                  </p>
                ) : (
                  employeeHours.map((emp: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {emp.name}
                          </div>
                          {emp.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {emp.email}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {emp.hours.toFixed(1)}h
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {emp.entries.length} rapporter
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${effectiveHours > 0 ? (emp.hours / effectiveHours) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* AI Summary */}
          <AISummary
            type="project"
            data={{
              name: project.name,
              hours: effectiveHours,
              budgetedHours: budget,
              status: project.status || 'Pågående',
              customerName: (project as any)?.clients?.name || project.customer_name,
              timeEntries: timeEntries,
            }}
            className="mb-6 sm:mb-8"
          />

          {/* AI Budget Prediction */}
          {projectId && (
            <div className="mb-6 sm:mb-8">
              <BudgetAIPrediction projectId={projectId as string} />
            </div>
          )}

          {/* AI Material Identifier */}
          <div className="mb-6 sm:mb-8">
            <MaterialAIIdentifier />
          </div>

          {/* AI Project Planning */}
          {projectId && (
            <div className="mb-6 sm:mb-8">
              <ProjectAIPlanning projectId={projectId as string} />
            </div>
          )}

          {/* Project Analytics */}
          {projectId && (
            <div className="mb-6 sm:mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Projektanalys
                </h2>
                <ProjectAnalytics projectId={projectId as string} />
              </div>
            </div>
          )}

          {/* Files Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Bilagor</h2>
            <FileUpload 
              entityType="project" 
              entityId={projectId}
              onUploadComplete={() => {
                // Trigger refresh
                window.location.reload()
              }}
            />
            <div className="mt-4">
              <FileList entityType="project" entityId={projectId} />
            </div>
          </div>

          {/* Action Buttons - Only show for admins - Collapsible */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8 overflow-hidden">
              <details className="group">
                <summary className="cursor-pointer p-4 sm:p-6 lg:p-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Fakturering</h2>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <button
                      onClick={() => router.push(`/invoices/new?projectId=${projectId}`)}
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 sm:py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base"
                    >
                      📝 Skapa faktura
                    </button>
                    {/* AI Invoice Suggestion - Show inline when creating invoice */}
                    {projectId && (
                      <div className="sm:col-span-2 lg:col-span-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          💡 AI-stöd: Använd AI-förslag när du skapar fakturan
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleSendInvoice}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 sm:py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base"
                    >
                      ✉️ Skapa & skicka
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 sm:py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base"
                    >
                      📄 Ladda ner PDF
                    </button>
                  </div>
                </div>
              </details>
            </div>
          )}
          
          {/* Request invoice button for non-admins */}
          {!isAdmin && !adminLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Fakturering</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
                  📧 Begär fakturering
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                  Endast administratörer kan skapa och skicka fakturor. Kontakta en administratör för att begära fakturering av detta projekt.
                </p>
                <button
                  onClick={() => {
                    const subject = encodeURIComponent(`Begäran om fakturering: ${project.name}`)
                    const body = encodeURIComponent(`Hej,\n\nJag skulle vilja begära fakturering för projektet "${project.name}".\n\nProjekt-ID: ${projectId}\nTotala timmar: ${effectiveHours.toFixed(1)}h\n\nTack!`)
                    window.location.href = `mailto:admin@example.com?subject=${subject}&body=${body}`
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  📧 Skicka begäran via e-post
                </button>
              </div>
            </div>
          )}

          {/* Archive Button */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Projekthantering</h2>
            {project.status === 'archived' || project.status === 'completed' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
                    ✅ Projektet är arkiverat
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Detta projekt är markerat som {project.status === 'archived' ? 'arkiverat' : 'klart'} och syns i arkivet.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm(`Vill du återställa projektet "${project.name}"? Det kommer att synas bland aktiva projekt igen.`)) {
                      return
                    }
                    
                    try {
                      const { error } = await supabase
                        .from('projects')
                        .update({ status: 'active' })
                        .eq('id', projectId)
                        .eq('tenant_id', tenantId)
                      
                      if (error) {
                        // Try without status if column doesn't exist
                        if (error.code === '42703' || error.message?.includes('status')) {
                          toast.error('Status-kolumn finns inte i databasen. Kontakta administratören.')
                          return
                        }
                        throw error
                      }
                      
                      toast.success('Projekt återställt!')
                      router.push('/projects')
                    } catch (err: any) {
                      console.error('Error restoring project:', err)
                      toast.error('Kunde inte återställa projekt: ' + (err.message || 'Okänt fel'))
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  🔄 Återställ projekt
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (!confirm(`Vill du arkivera projektet "${project.name}"? Det kommer att flyttas till arkivet.`)) {
                    return
                  }
                  
                  try {
                    // First try with status column
                    let { error } = await supabase
                      .from('projects')
                      .update({ status: 'archived' })
                      .eq('id', projectId)
                      .eq('tenant_id', tenantId)
                    
                    // If status column doesn't exist, try 'completed'
                    if (error && (error.code === '42703' || error.message?.includes('status'))) {
                      const fallback = await supabase
                        .from('projects')
                        .update({ status: 'completed' })
                        .eq('id', projectId)
                        .eq('tenant_id', tenantId)
                      
                      if (fallback.error) {
                        throw fallback.error
                      }
                      
                      toast.success('Projekt markerat som klart och arkiverat!')
                    } else if (error) {
                      throw error
                    } else {
                      toast.success('Projekt arkiverat!')
                      
                      // Add notification
                      if (typeof window !== 'undefined') {
                        const { addNotification } = await import('@/lib/notifications')
                        addNotification({
                          type: 'info',
                          title: 'Projekt arkiverat',
                          message: `Projektet "${project.name}" har arkiverats`,
                          link: '/projects'
                        })
                      }
                    }
                    
                    // Redirect to projects list
                    router.push('/projects')
                  } catch (err: any) {
                    console.error('Error archiving project:', err)
                    toast.error('Kunde inte arkivera projekt: ' + (err.message || 'Okänt fel'))
                  }
                }}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                📦 Arkivera projekt
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
