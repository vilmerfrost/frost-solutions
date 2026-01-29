'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import FileUpload from '@/components/FileUpload'
import FileList from '@/components/FileList'
import ATA2Card from '@/components/ATA2Card'
import BudgetCard from '@/components/BudgetCard'
import { ScheduleCalendar } from '@/components/scheduling/ScheduleCalendar'
import { useAdmin } from '@/hooks/useAdmin'
import { ExportToIntegrationButton } from '@/components/integrations/ExportToIntegrationButton'
import { 
 Sparkles, 
 Clock, 
 DollarSign, 
 FileText, 
 Users, 
 Settings, 
 Calendar,
 MapPin,
 Building,
 FileEdit,
 Send,
 Download,
 Archive,
 RotateCcw,
 Mail,
 TrendingUp,
 Briefcase,
 Home
} from 'lucide-react'
import { BudgetAIPrediction } from '@/components/ai/BudgetAIPrediction'
import { MaterialAIIdentifier } from '@/components/ai/MaterialAIIdentifier'
import { ProjectAIPlanning } from '@/components/ai/ProjectAIPlanning'
import { ProjectAnalytics } from '@/components/analytics/ProjectAnalytics'
import { ProjectEmployeeManager } from '@/components/projects/ProjectEmployeeManager'
import { apiFetch } from '@/lib/http/fetcher'
import DetailLayout from '@/components/DetailLayout'
import { StatCard } from '@/components/cards/StatCard'

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
 price_model?: 'hourly' | 'fixed' | 'budget' | null
 markup_percent?: number | null
 site_address?: string | null
 description?: string | null
 is_rot_rut?: boolean | null
 property_designation?: string | null
 apartment_number?: string | null
 start_date?: string | null
 end_date?: string | null
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
 const [activeTab, setActiveTab] = useState('overview')
 const { isAdmin, loading: adminLoading } = useAdmin()

 const projectId = params?.id as string | undefined

 useEffect(() => {
  if (!projectId) {
   setLoading(false)
   setError('Ingen projekt-ID angiven')
   return
  }

  if (!tenantId) {
   console.log('⏳ Waiting for tenantId...')
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
    
    if (!projectId || !tenantId) {
     setError('Saknar projekt ID eller tenant ID')
     setLoading(false)
     return
    }

    console.log('🔍 Loading project:', { projectId, tenantId })
    
    let projectData = null
    let projectError = null
    
    try {
     const result = await apiFetch<{ project?: any }>(`/api/projects/${projectId}?_t=${Date.now()}`, {
      cache: 'no-store',
     })
     projectData = result.project
    } catch (fetchErr: any) {
     projectError = { message: fetchErr.message || 'Network error' }
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
    
    const proj = projectData as any
    console.log('✅ Project loaded:', proj.name)

    setProject({
     ...(projectData as ProjectRecord),
     client_id: proj.client_id || null,
     clients: proj.clients || null,
    } as ProjectRecord)

    try {
     console.log('📊 Project page: Fetching project hours from API...')
     const hoursData = await apiFetch<{ hours?: number; entries?: any[] }>(`/api/projects/${projectId}/hours?projectId=${projectId}&_t=${Date.now()}`, {
      cache: 'no-store',
     })
     console.log('✅ Project page: Hours fetched:', hoursData)
     setHours(hoursData.hours || 0)
     setTimeEntries(hoursData.entries || [])
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

 useEffect(() => {
  if (!projectId) return

  const handleTimeEntryUpdate = (event: Event) => {
   const customEvent = event as CustomEvent
   console.log('🔄 Project page: Time entry updated event received!', customEvent.detail)
   
   const eventProjectId = customEvent.detail?.projectId
   if (eventProjectId && eventProjectId !== projectId) {
    console.log('⏭️ Project page: Event is for different project, skipping', { eventProjectId, currentProjectId: projectId })
    return
   }
   
   setTimeout(() => {
    console.log('⏰ Project page: Triggering refresh...')
    setRefreshTrigger(prev => {
     const newValue = prev + 1
     console.log('✅ Project page: Refresh trigger updated:', newValue)
     return newValue
    })
   }, 500)
  }
  
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
  
  if (typeof window !== 'undefined') {
   window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   document.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   document.body?.addEventListener('timeEntryUpdated', handleTimeEntryUpdate)
   window.addEventListener('storage', handleStorageChange)
   console.log('✅ Project page: Event listeners registered for timeEntryUpdated on window, document, and body')
   
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
 }, [projectId])

 // Load employee hours when switching to team tab
 useEffect(() => {
  if (activeTab === 'team' && employeeHours.length === 0 && projectId) {
   setLoadingEmployeeHours(true)
   apiFetch<{ employees?: any[] }>(`/api/projects/${projectId}/employee-hours?projectId=${projectId}`)
    .then(data => {
     setEmployeeHours(data.employees || [])
    })
    .catch(err => {
     console.error('Error fetching employee hours:', err)
    })
    .finally(() => {
     setLoadingEmployeeHours(false)
    })
  }
 }, [activeTab, projectId, employeeHours.length])

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

   let clientId: string | null = null
   let clientName: string = 'Okänd kund'
   
   if (project?.client_id) {
    clientId = project.client_id
   } else if (project?.clients?.id) {
    clientId = project.clients.id
    clientName = project.clients.name || project?.customer_name || 'Okänd kund'
   } else if (project?.customer_name) {
    clientName = project.customer_name
   }
   
   if (!clientId && projectId) {
    try {
     const { data: projectData } = await supabase
      .from('projects')
      .select('client_id, clients(id, name), customer_name')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .single()
     
     if (projectData) {
      const proj = projectData as any
      clientId = proj.client_id || proj?.clients?.id || null
      clientName = proj?.clients?.name || proj.customer_name || 'Okänd kund'
     }
    } catch (err) {
     console.warn('Could not fetch client info from project:', err)
    }
   }
   
   console.log('📝 Invoice creation - Client info:', { clientId, clientName, projectId })
   
   let result: any
   try {
    result = await apiFetch<{ data?: { id?: string }; error?: string; details?: string; availableTenants?: any[]; suggestion?: string; diagnostics?: any; warning?: string }>('/api/invoices/create', {
     method: 'POST',
     body: JSON.stringify({
      tenant_id: tenantId,
      project_id: projectId,
      client_id: clientId,
      customer_name: clientName,
      amount,
      desc: `${totalHours.toFixed(1)} timmar @ ${rate} kr/tim`,
      description: `${totalHours.toFixed(1)} timmar @ ${rate} kr/tim`,
      status: 'sent',
      issue_date: new Date().toISOString().split('T')[0],
     }),
    })
   } catch (apiErr: any) {
    console.error('❌ Error creating invoice:', apiErr)
    toast.error('Kunde inte skapa faktura: ' + (apiErr.message || 'Okänt fel'))
    return
   }

   if (result.error) {
    console.error('❌ Error creating invoice:', result)
    
    let errorMessage = result.error
    if (result.details) {
     errorMessage += `: ${result.details}`
    }
    if (result.suggestion) {
     errorMessage += `. ${result.suggestion}`
    }
    
    toast.error(errorMessage)
    return
   }

   if (result.warning) {
    toast.info(result.warning)
   }

   toast.success('Faktura skapad och skickad!')
   router.push(`/invoices/${result.data?.id}`)
  } catch (err: any) {
   toast.error('Fel: ' + err.message)
  }
 }

 async function handleDownloadPDF() {
  if (!isAdmin) {
   toast.error('Endast administratörer kan ladda ner fakturor.')
   return
  }
  
  if (!projectId || !tenantId) {
   toast.error('Saknade data för att skapa faktura')
   return
  }
  
  try {
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
    toast.error('Inga ofakturerade timmar att skapa faktura för.')
    return
   }

   const rate = Number(project?.base_rate_sek ?? 0) || 360
   const amount = totalHours * rate

   let clientId: string | null = null
   let clientName: string = 'Okänd kund'
   
   if (project?.client_id) {
    clientId = project.client_id
   } else if (project?.clients?.id) {
    clientId = project.clients.id
    clientName = project.clients.name || project?.customer_name || 'Okänd kund'
   } else if (project?.customer_name) {
    clientName = project.customer_name
   }
   
   if (!clientId && projectId) {
    try {
     const { data: projectData } = await supabase
      .from('projects')
      .select('client_id, clients(id, name), customer_name')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .single()
     
     if (projectData) {
      const proj = projectData as any
      clientId = proj.client_id || proj?.clients?.id || null
      clientName = proj?.clients?.name || proj.customer_name || 'Okänd kund'
     }
    } catch (err) {
     console.warn('Could not fetch client info from project:', err)
    }
   }

   let result: any
   try {
    result = await apiFetch<{ data?: { id?: string }; error?: string }>('/api/invoices/create', {
     method: 'POST',
     body: JSON.stringify({
      tenant_id: tenantId,
      project_id: projectId,
      client_id: clientId,
      customer_name: clientName,
      amount,
      desc: `${totalHours.toFixed(1)} timmar @ ${rate} kr/tim`,
      description: `${totalHours.toFixed(1)} timmar @ ${rate} kr/tim`,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
     }),
    })
   } catch (apiErr: any) {
    console.error('❌ Error creating invoice:', apiErr)
    toast.error('Kunde inte skapa faktura: ' + (apiErr.message || 'Okänt fel'))
    return
   }

   if (result.error || !result.data?.id) {
    toast.error('Kunde inte skapa faktura: ' + (result.error || 'Okänt fel'))
    return
   }

   window.open(`/api/invoices/${result.data.id}?download=true`, '_blank')
   toast.success('PDF laddas ner...')
  } catch (err: any) {
   toast.error('Fel: ' + err.message)
  }
 }

 async function handleArchiveProject() {
  if (!confirm(`Vill du arkivera projektet "${project?.name}"? Det kommer att flyttas till arkivet.`)) {
   return
  }
  
  if (!projectId || !tenantId) {
   toast.error('Saknar projekt ID eller tenant ID')
   return
  }

  try {
   let { error } = await (supabase
    .from('projects') as any)
    .update({ status: 'archived' })
    .eq('id', projectId)
    .eq('tenant_id', tenantId)
   
   if (error && (error.code === '42703' || error.message?.includes('status'))) {
    const fallback = await (supabase
     .from('projects') as any)
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
    
    if (typeof window !== 'undefined') {
     const { addNotification } = await import('@/lib/notifications')
     addNotification({
      type: 'info',
      title: 'Projekt arkiverat',
      message: `Projektet "${project?.name}" har arkiverats`,
      link: '/projects'
     })
    }
   }
   
   router.push('/projects')
  } catch (err: any) {
   console.error('Error archiving project:', err)
   toast.error('Kunde inte arkivera projekt: ' + (err.message || 'Okänt fel'))
  }
 }

 async function handleRestoreProject() {
  if (!confirm(`Vill du återställa projektet "${project?.name}"? Det kommer att synas bland aktiva projekt igen.`)) {
   return
  }
  
  if (!projectId || !tenantId) {
   toast.error('Saknar projekt ID eller tenant ID')
   return
  }

  try {
   const { error } = await (supabase
    .from('projects') as any)
    .update({ status: 'active' })
    .eq('id', projectId)
    .eq('tenant_id', tenantId)
   
   if (error) {
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
 }

 const effectiveHours = Number.isFinite(hours) ? hours : 0
 const rate = Number(project?.base_rate_sek ?? 0) || 360
 const sum = effectiveHours * rate
 const budget = Number(project?.budgeted_hours ?? 0)
 const progress = budget > 0 ? Math.min((effectiveHours / budget) * 100, 100) : 0

 // Build status badges
 const statusBadges: Array<{ label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = []
 
 if (project?.is_rot_rut) {
  statusBadges.push({ label: 'ROT-avdrag', variant: 'success' })
 }
 
 if (project?.price_model) {
  const priceModelLabels: Record<string, string> = {
   hourly: 'Löpande',
   fixed: 'Fast pris',
   budget: 'Budget'
  }
  statusBadges.push({ label: priceModelLabels[project.price_model] || project.price_model, variant: 'info' })
 }
 
 if (project?.status === 'archived' || project?.status === 'completed') {
  statusBadges.push({ label: 'Arkiverad', variant: 'default' })
 }

 // Build header actions
 const headerActions = (
  <div className="flex flex-wrap gap-2">
   <ExportToIntegrationButton
    type="project"
    resourceId={project?.id || ''}
    resourceName={project?.name || ''}
    variant="button"
   />
   {isAdmin && (
    <button
     onClick={() => router.push(`/invoices/new?projectId=${projectId}`)}
     className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
    >
     <FileEdit className="w-4 h-4" />
     Skapa faktura
    </button>
   )}
  </div>
 )

 // Define tabs
 const tabs = [
  { id: 'overview', label: 'Översikt', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'financials', label: 'Ekonomi', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
  { id: 'files', label: 'Filer', icon: <FileText className="w-4 h-4" /> },
  { id: 'advanced', label: 'Avancerat', icon: <Settings className="w-4 h-4" /> },
 ]

 // Overview Tab Content
 const renderOverviewTab = () => (
  <div className="space-y-6">
   {/* Stats Cards */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
     label="Rapporterade timmar"
     value={`${effectiveHours.toFixed(1)}h`}
     icon={<Clock className="w-5 h-5" />}
     iconColor="blue"
    />
    <StatCard
     label="Timpris"
     value={`${rate.toLocaleString('sv-SE')} kr`}
     icon={<DollarSign className="w-5 h-5" />}
     iconColor="green"
    />
    <StatCard
     label="Ofakturerat"
     value={`${sum.toLocaleString('sv-SE')} kr`}
     icon={<TrendingUp className="w-5 h-5" />}
     iconColor="yellow"
    />
    {budget > 0 && (
     <StatCard
      label="Budget"
      value={`${budget}h`}
      icon={<Briefcase className="w-5 h-5" />}
      iconColor="blue"
      trend={{ value: `${progress.toFixed(0)}%`, direction: progress < 90 ? 'up' : 'down' }}
     />
    )}
   </div>

   {/* Budget Progress Bar */}
   {budget > 0 && (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
     <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
      <span>Budgetprogression</span>
      <span className="font-bold">{progress.toFixed(0)}%</span>
     </div>
     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
      <div
       className={`h-full bg-gradient-to-r ${
        progress >= 90 ? 'from-red-500 to-red-600' :
        progress >= 70 ? 'from-orange-500 to-orange-600' :
        'from-primary-400 to-primary-500'
       } rounded-full transition-all duration-500`}
       style={{ width: `${Math.min(progress, 100)}%` }}
      />
     </div>
    </div>
   )}

   {/* Project Info Card */}
   {(project?.site_address || project?.description || project?.start_date || project?.property_designation) && (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <Building className="w-5 h-5 text-gray-400" />
      Projektinformation
     </h3>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {project?.site_address && (
       <div className="flex items-start gap-3">
        <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        <div>
         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Objektsadress</p>
         <p className="text-sm text-gray-900 dark:text-white">{project.site_address}</p>
        </div>
       </div>
      )}
      {(project?.start_date || project?.end_date) && (
       <div className="flex items-start gap-3">
        <Calendar className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        <div>
         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Period</p>
         <p className="text-sm text-gray-900 dark:text-white">
          {project?.start_date ? new Date(project.start_date).toLocaleDateString('sv-SE') : '?'} 
          {' - '} 
          {project?.end_date ? new Date(project.end_date).toLocaleDateString('sv-SE') : 'pågående'}
         </p>
        </div>
       </div>
      )}
      {project?.markup_percent && (
       <div className="flex items-start gap-3">
        <TrendingUp className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        <div>
         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Materialpåslag</p>
         <p className="text-sm text-gray-900 dark:text-white">{project.markup_percent}%</p>
        </div>
       </div>
      )}
      {project?.property_designation && (
       <div className="flex items-start gap-3">
        <Home className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        <div>
         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fastighetsbeteckning (ROT)</p>
         <p className="text-sm text-gray-900 dark:text-white">{project.property_designation}</p>
        </div>
       </div>
      )}
      {project?.apartment_number && (
       <div className="flex items-start gap-3">
        <Building className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        <div>
         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lägenhetsnummer</p>
         <p className="text-sm text-gray-900 dark:text-white">{project.apartment_number}</p>
        </div>
       </div>
      )}
      {project?.description && (
       <div className="sm:col-span-2 flex items-start gap-3">
        <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
        <div>
         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Beskrivning</p>
         <p className="text-sm text-gray-900 dark:text-white whitespace-pre-line">{project.description}</p>
        </div>
       </div>
      )}
     </div>
    </div>
   )}

   {/* Project Analytics */}
   {projectId && (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <TrendingUp className="w-5 h-5 text-gray-400" />
      Projektanalys
     </h3>
     <ProjectAnalytics projectId={projectId} />
    </div>
   )}
  </div>
 )

 // Financials Tab Content
 const renderFinancialsTab = () => (
  <div className="space-y-6">
   {/* Export Integration Card */}
   {project && (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-blue-900/40 dark:to-blue-800/40 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
       <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-white" />
        Exportera till bokföringssystem
       </h3>
       <p className="text-sm text-white/80">
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
   )}

   {/* Invoice Actions */}
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
     <FileText className="w-5 h-5 text-gray-400" />
     Fakturering
    </h3>
    
    {isAdmin ? (
     <>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
       Skapa faktura från projektets ofakturerade timmar eller ladda ner som PDF.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
       <button
        onClick={() => router.push(`/invoices/new?projectId=${projectId}`)}
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
       >
        <FileEdit className="w-5 h-5" />
        Skapa faktura
       </button>
       <button
        onClick={handleSendInvoice}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
       >
        <Send className="w-5 h-5" />
        Skapa & skicka
       </button>
       <button
        onClick={handleDownloadPDF}
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
       >
        <Download className="w-5 h-5" />
        Ladda ner PDF
       </button>
      </div>
     </>
    ) : !adminLoading && (
     <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2 flex items-center gap-2">
       <Mail className="w-4 h-4" />
       Begär fakturering
      </p>
      <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
       Endast administratörer kan skapa och skicka fakturor. Kontakta en administratör för att begära fakturering av detta projekt.
      </p>
      <button
       onClick={() => {
        const subject = encodeURIComponent(`Begäran om fakturering: ${project?.name}`)
        const body = encodeURIComponent(`Hej,\n\nJag skulle vilja begära fakturering för projektet "${project?.name}".\n\nProjekt-ID: ${projectId}\nTotala timmar: ${effectiveHours.toFixed(1)}h\n\nTack!`)
        window.location.href = `mailto:admin@example.com?subject=${subject}&body=${body}`
       }}
       className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
      >
       <Mail className="w-4 h-4" />
       Skicka begäran via e-post
      </button>
     </div>
    )}
   </div>

   {/* Budget Card */}
   {project && (
    <BudgetCard projectId={project.id} tenantId={project.tenant_id || tenantId || ''} />
   )}

   {/* Project Management */}
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
     <Settings className="w-5 h-5 text-gray-400" />
     Projekthantering
    </h3>
    {project?.status === 'archived' || project?.status === 'completed' ? (
     <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
       <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
        ✅ Projektet är arkiverat
       </p>
       <p className="text-sm text-blue-600 dark:text-blue-400">
        Detta projekt är markerat som {project?.status === 'archived' ? 'arkiverat' : 'klart'} och syns i arkivet.
       </p>
      </div>
      <button
       onClick={handleRestoreProject}
       className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
       <RotateCcw className="w-5 h-5" />
       Återställ projekt
      </button>
     </div>
    ) : (
     <button
      onClick={handleArchiveProject}
      className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
     >
      <Archive className="w-5 h-5" />
      Arkivera projekt
     </button>
    )}
   </div>
  </div>
 )

 // Team Tab Content
 const renderTeamTab = () => (
  <div className="space-y-6">
   {/* Employee Hours */}
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
     <Clock className="w-5 h-5 text-gray-400" />
     Anställdas timmar
    </h3>
    
    {loadingEmployeeHours ? (
     <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 dark:border-primary-800 border-t-purple-600 dark:border-t-purple-400"></div>
     </div>
    ) : employeeHours.length === 0 ? (
     <p className="text-gray-500 dark:text-gray-400 text-center py-8">
      Inga tidsrapporter registrerade ännu.
     </p>
    ) : (
     <div className="space-y-3">
      {employeeHours.map((emp: any, idx: number) => (
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
          className="bg-primary-500 h-2 rounded-full transition-all"
          style={{ width: `${effectiveHours > 0 ? (emp.hours / effectiveHours) * 100 : 0}%` }}
         />
        </div>
       </div>
      ))}
     </div>
    )}
   </div>

   {/* Project Employee Manager */}
   {project && (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <Users className="w-5 h-5 text-gray-400" />
      Hantera teammedlemmar
     </h3>
     <ProjectEmployeeManager projectId={project.id} />
    </div>
   )}
  </div>
 )

 // Files Tab Content
 const renderFilesTab = () => (
  <div className="space-y-6">
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
     <FileText className="w-5 h-5 text-gray-400" />
     Bilagor
    </h3>
    <FileUpload 
     entityType="project" 
     entityId={projectId || ''}
     onUploadComplete={() => {
      window.location.reload()
     }}
    />
    <div className="mt-4">
     <FileList entityType="project" entityId={projectId || ''} />
    </div>
   </div>
  </div>
 )

 // Advanced Tab Content
 const renderAdvancedTab = () => (
  <div className="space-y-6">
   {/* ÄTA 2.0 Section */}
   {project && (
    <ATA2Card projectId={project.id} tenantId={project.tenant_id || tenantId || ''} />
   )}

   {/* Schedule Calendar Section */}
   {project && (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <Calendar className="w-5 h-5 text-gray-400" />
      Schema för projektet
     </h3>
     <ScheduleCalendar projectId={project.id} />
    </div>
   )}

   {/* AI Budget Prediction */}
   {projectId && (
    <BudgetAIPrediction projectId={projectId} />
   )}

   {/* AI Material Identifier */}
   <MaterialAIIdentifier />

   {/* AI Project Planning */}
   {projectId && (
    <ProjectAIPlanning projectId={projectId} />
   )}
  </div>
 )

 // Render tab content based on active tab
 const renderTabContent = () => {
  switch (activeTab) {
   case 'overview':
    return renderOverviewTab()
   case 'financials':
    return renderFinancialsTab()
   case 'team':
    return renderTeamTab()
   case 'files':
    return renderFilesTab()
   case 'advanced':
    return renderAdvancedTab()
   default:
    return renderOverviewTab()
  }
 }

 return (
  <DetailLayout
   title={project?.name || 'Laddar...'}
   subtitle={(project as any)?.clients?.name || project?.customer_name || 'Ingen kund angiven'}
   status={statusBadges}
   actions={headerActions}
   tabs={tabs}
   activeTab={activeTab}
   onTabChange={setActiveTab}
   loading={loading || !tenantId}
   error={error || (!project && !loading ? 'Projektet hittas inte!' : null)}
   onBack={() => router.back()}
  >
   {renderTabContent()}
  </DetailLayout>
 )
}
