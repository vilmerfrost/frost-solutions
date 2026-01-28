'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import { BASE_PATH } from '@/utils/url'
import { 
 ChevronLeft, 
 AlertTriangle, 
 Info, 
 Plus, 
 Trash2,
 Home,
 Building2,
 Calendar,
 FileText,
 DollarSign,
 CheckCircle
} from 'lucide-react'

interface Project {
 id: string
 name: string
 client_id?: string
}

interface Client {
 id: string
 name: string
 personal_id?: string
 property_designation?: string
}

interface WorkDetail {
 description: string
 hours: number
 hourlyRate: number
 total: number
}

type PropertyType = 'BRF' | 'HOUSE' | 'APARTMENT' | 'TOWNHOUSE' | 'OTHER'

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: any }[] = [
 { value: 'BRF', label: 'Bostadsrätt (BRF)', icon: Building2 },
 { value: 'HOUSE', label: 'Eget hus', icon: Home },
 { value: 'APARTMENT', label: 'Lägenhet (hyresrätt)', icon: Building2 },
 { value: 'TOWNHOUSE', label: 'Radhus', icon: Home },
 { value: 'OTHER', label: 'Annat', icon: Home },
]

const WORK_TYPES = [
 { value: 'reparation', label: 'Reparation' },
 { value: 'ombyggnad', label: 'Ombyggnad' },
 { value: 'tillbyggnad', label: 'Tillbyggnad' },
 { value: 'renovering', label: 'Renovering' },
 { value: 'underhåll', label: 'Underhåll' },
]

export default function NewRotApplicationPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const { isAdmin, loading: adminLoading } = useAdmin()
 const [loading, setLoading] = useState(false)
 const [loadingData, setLoadingData] = useState(true)
 
 // Data
 const [projects, setProjects] = useState<Project[]>([])
 const [clients, setClients] = useState<Client[]>([])
 const [yearlyUsed, setYearlyUsed] = useState<number>(0)
 const [loadingYearly, setLoadingYearly] = useState(false)
 
 // Basic form data
 const [projectId, setProjectId] = useState('')
 const [clientId, setClientId] = useState('')
 const [customerPersonNumber, setCustomerPersonNumber] = useState('')
 const [propertyDesignation, setPropertyDesignation] = useState('')
 const [workType, setWorkType] = useState('')
 
 // SKV 5017 enhanced fields
 const [propertyType, setPropertyType] = useState<PropertyType | ''>('')
 const [apartmentNumber, setApartmentNumber] = useState('')
 const [brfOrgNumber, setBrfOrgNumber] = useState('')
 const [workStartDate, setWorkStartDate] = useState('')
 const [workEndDate, setWorkEndDate] = useState('')
 
 // Itemized work details
 const [workDetails, setWorkDetails] = useState<WorkDetail[]>([
  { description: '', hours: 0, hourlyRate: 650, total: 0 }
 ])
 
 // Material cost (not ROT-eligible)
 const [materialCost, setMaterialCost] = useState('')
 
 // Customer declarations
 const [declarations, setDeclarations] = useState({
  isOwner: false,
  isPrivateResidence: false,
  isRepairWork: false,
  isCertifiedCompany: false,
  willDeclare: false,
 })

 // Calculations
 const workCostTotal = workDetails.reduce((sum, d) => sum + d.total, 0)
 const deductionRate = 0.50 // 50% for ROT
 const maxYearlyDeduction = 50000
 const remainingDeduction = Math.max(0, maxYearlyDeduction - yearlyUsed)
 const potentialDeduction = Math.min(workCostTotal * deductionRate, remainingDeduction)
 const isOverLimit = (workCostTotal * deductionRate) > remainingDeduction

 useEffect(() => {
  if (!tenantId) {
   setLoadingData(false)
   return
  }

  async function loadData() {
   if (!tenantId) return
   try {
    // Load projects
    const { data: projectsData } = await supabase
     .from('projects')
     .select('id, name, client_id, status')
     .eq('tenant_id', tenantId)
     .order('name')

    const activeProjects = (projectsData || []).filter(
     (p: any) => p.status !== 'completed' && p.status !== 'archived'
    )

    // Load clients (only private clients for ROT)
    const { data: clientsData } = await supabase
     .from('clients')
     .select('id, name, personal_id, property_designation, client_type')
     .eq('tenant_id', tenantId)
     .order('name')

    // Filter for private clients only (ROT is for private persons)
    const privateClients = (clientsData || []).filter(
     (c: any) => c.client_type === 'private' || !c.client_type
    )

    setProjects(activeProjects)
    setClients(privateClients)
   } catch (err) {
    console.error('Error loading data:', err)
   } finally {
    setLoadingData(false)
   }
  }

  loadData()
 }, [tenantId])

 // Auto-fill client when project is selected
 useEffect(() => {
  if (projectId) {
   const project = projects.find(p => p.id === projectId)
   if (project?.client_id) {
    setClientId(project.client_id)
   }
  }
 }, [projectId, projects])

 // Auto-fill from client data
 useEffect(() => {
  if (clientId) {
   const client = clients.find(c => c.id === clientId)
   if (client) {
    if (client.personal_id && !customerPersonNumber) {
     setCustomerPersonNumber(client.personal_id)
    }
    if (client.property_designation && !propertyDesignation) {
     setPropertyDesignation(client.property_designation)
    }
   }
  }
 }, [clientId, clients])

 // Fetch yearly used deduction when person number changes
 useEffect(() => {
  async function fetchYearlyDeduction() {
   if (!customerPersonNumber || customerPersonNumber.length < 10 || !tenantId) {
    setYearlyUsed(0)
    return
   }
   
   setLoadingYearly(true)
   try {
    const currentYear = new Date().getFullYear()
    const { data } = await supabase
     .from('rot_applications')
     .select('deductible_amount, status')
     .eq('customer_person_number', customerPersonNumber.replace(/[-\s]/g, ''))
     .gte('created_at', `${currentYear}-01-01`)
     .lte('created_at', `${currentYear}-12-31`)
     .in('status', ['approved', 'submitted', 'under_review'])
    
    const used = (data || []).reduce((sum: number, r: any) => sum + (r.deductible_amount || 0), 0)
    setYearlyUsed(used)
   } catch (err) {
    console.error('Error fetching yearly deduction:', err)
   } finally {
    setLoadingYearly(false)
   }
  }
  fetchYearlyDeduction()
 }, [customerPersonNumber, tenantId])

 // Validate Swedish person number
 function validatePersonNumber(pnr: string): boolean {
  const clean = pnr.replace(/[-\s]/g, '')
  if (clean.length !== 12) return false
  const regex = /^\d{12}$/
  if (!regex.test(clean)) return false
  
  const year = parseInt(clean.substring(0, 4))
  const month = parseInt(clean.substring(4, 6))
  const day = parseInt(clean.substring(6, 8))
  
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1900 || year > new Date().getFullYear()) return false
  
  return true
 }

 // Update work detail
 const updateWorkDetail = (index: number, field: keyof WorkDetail, value: any) => {
  const updated = [...workDetails]
  updated[index] = { ...updated[index], [field]: value }
  // Recalculate total
  updated[index].total = updated[index].hours * updated[index].hourlyRate
  setWorkDetails(updated)
 }

 // Add work detail row
 const addWorkDetail = () => {
  setWorkDetails([...workDetails, { description: '', hours: 0, hourlyRate: 650, total: 0 }])
 }

 // Remove work detail row
 const removeWorkDetail = (index: number) => {
  if (workDetails.length > 1) {
   setWorkDetails(workDetails.filter((_, i) => i !== index))
  }
 }

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  if (!isAdmin) {
   toast.error('Endast administratörer kan skapa ROT-ansökningar.')
   return
  }

  if (!tenantId) {
   toast.error('Ingen tenant vald.')
   return
  }

  // Validations
  if (!validatePersonNumber(customerPersonNumber)) {
   toast.error('Ogiltigt personnummer. Använd formatet YYYYMMDD-XXXX.')
   return
  }

  if (!propertyDesignation.trim()) {
   toast.error('Fastighetsbeteckning krävs.')
   return
  }

  if (!propertyType) {
   toast.error('Välj bostadstyp.')
   return
  }

  if (propertyType === 'BRF' && !brfOrgNumber.trim()) {
   toast.error('BRF organisationsnummer krävs för bostadsrätt.')
   return
  }

  if (workCostTotal <= 0) {
   toast.error('Arbetskostnad måste vara större än 0.')
   return
  }

  // Check declarations
  const allDeclared = Object.values(declarations).every(v => v)
  if (!allDeclared) {
   toast.error('Alla deklarationer måste godkännas.')
   return
  }

  setLoading(true)

  try {
   const { data: userData } = await supabase.auth.getUser()
   if (!userData?.user?.id) {
    toast.error('Du är inte inloggad.')
    setLoading(false)
    return
   }

   const result = await apiFetch<{ error?: string; data?: any }>('/api/rot/create', {
    method: 'POST',
    body: JSON.stringify({
     tenant_id: tenantId,
     project_id: projectId || null,
     client_id: clientId || null,
     customer_person_number: customerPersonNumber.replace(/[-\s]/g, ''),
     property_designation: propertyDesignation,
     work_type: workType,
     work_cost_sek: workCostTotal,
     material_cost_sek: parseFloat(materialCost || '0'),
     total_cost_sek: workCostTotal + parseFloat(materialCost || '0'),
     // Enhanced SKV 5017 fields
     property_type: propertyType,
     apartment_number: propertyType === 'BRF' ? apartmentNumber : null,
     brf_org_number: propertyType === 'BRF' ? brfOrgNumber : null,
     work_start_date: workStartDate || null,
     work_end_date: workEndDate || null,
     work_details: workDetails.filter(d => d.description && d.total > 0),
     customer_declarations: declarations,
     deductible_amount: potentialDeduction,
     deduction_percentage: deductionRate * 100,
    }),
   })

   if (result.error) {
    toast.error('Kunde inte skapa ROT-ansökan: ' + result.error)
    setLoading(false)
    return
   }

   toast.success('ROT-ansökan skapad!')
   router.push(`${BASE_PATH}/rot/${result.data.id}`)
  } catch (err: any) {
   toast.error('Ett oväntat fel uppstod: ' + (err.message || 'Okänt fel'))
   setLoading(false)
  }
 }

 if (loadingData || adminLoading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 flex items-center justify-center">
     <div className="text-gray-500">Laddar...</div>
    </main>
   </div>
  )
 }

 if (!isAdmin) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 flex items-center justify-center">
     <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800 max-w-md text-center">
      <p className="text-red-800 dark:text-red-200 font-semibold mb-4">
       Endast administratörer kan skapa ROT-ansökningar.
      </p>
      <button
       onClick={() => router.push(`${BASE_PATH}/rot`)}
       className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
      >
       Tillbaka
      </button>
     </div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6">
      <button
       onClick={() => router.back()}
       className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
       <ChevronLeft className="w-5 h-5" />
       Tillbaka
      </button>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
       Ny ROT-ansökan
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
       Registrera ROT-arbete enligt SKV 5017
      </p>
     </div>

     {/* SKV 5017 Notice */}
     <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
       <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
       <div>
        <p className="font-semibold text-blue-800 dark:text-blue-200">SKV 5017 - Skatteverkets blankett</p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
         Detta formulär motsvarar Skatteverkets blankett för ROT-avdrag. Alla obligatoriska fält måste fyllas i korrekt.
        </p>
       </div>
      </div>
     </div>

     <form onSubmit={handleSubmit} className="space-y-6">
      {/* A. FAKTURAMOTTAGARE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-500" />
        A. Fakturamottagare (Kunden)
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Projekt (valfritt)
         </label>
         <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         >
          <option value="">Välj projekt...</option>
          {projects.map((p) => (
           <option key={p.id} value={p.id}>{p.name}</option>
          ))}
         </select>
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Privatperson *
         </label>
         <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          required
         >
          <option value="">Välj privatperson...</option>
          {clients.map((c) => (
           <option key={c.id} value={c.id}>{c.name}</option>
          ))}
         </select>
         <p className="text-xs text-gray-500 mt-1">Endast privatpersoner kan få ROT-avdrag</p>
        </div>
       </div>

       <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
         Personnummer *
        </label>
        <input
         type="text"
         value={customerPersonNumber}
         onChange={(e) => setCustomerPersonNumber(e.target.value)}
         placeholder="YYYYMMDD-XXXX"
         className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         required
        />
       </div>

       {/* Yearly Limit Display */}
       {customerPersonNumber && customerPersonNumber.length >= 10 && (
        <div className={`mt-4 p-4 rounded-lg ${isOverLimit ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
         <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
           Kundens använda ROT {new Date().getFullYear()}:
          </span>
          <span className="font-semibold">
           {loadingYearly ? '...' : `${yearlyUsed.toLocaleString('sv-SE')} kr`}
          </span>
         </div>
         <div className="flex justify-between items-center mt-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
           Återstår att använda:
          </span>
          <span className={`font-semibold ${isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
           {remainingDeduction.toLocaleString('sv-SE')} kr
          </span>
         </div>
         {isOverLimit && (
          <div className="mt-2 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
           <AlertTriangle className="w-4 h-4" />
           <span>Överstiger årsgränsen på 50 000 kr!</span>
          </div>
         )}
        </div>
       )}
      </div>

      {/* B. FASTIGHETSUPPGIFTER */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Home className="w-5 h-5 text-primary-500" />
        B. Fastighetsuppgifter
       </h2>

       <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
         Bostadstyp *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
         {PROPERTY_TYPES.map((type) => (
          <button
           key={type.value}
           type="button"
           onClick={() => setPropertyType(type.value)}
           className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
            propertyType === type.value
             ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
             : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
           }`}
          >
           <type.icon className="w-5 h-5" />
           <span className="text-sm font-medium">{type.label}</span>
          </button>
         ))}
        </div>
       </div>

       <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
         Fastighetsbeteckning *
        </label>
        <input
         type="text"
         value={propertyDesignation}
         onChange={(e) => setPropertyDesignation(e.target.value)}
         placeholder="T.ex. Sätra 4:22"
         className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         required
        />
        <p className="text-xs text-gray-500 mt-1">Hittas via Lantmäteriet eller senaste fastighetstaxeringen</p>
       </div>

       {propertyType === 'BRF' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
           Lägenhetsnummer
          </label>
          <input
           type="text"
           value={apartmentNumber}
           onChange={(e) => setApartmentNumber(e.target.value)}
           placeholder="T.ex. LGH 1402"
           className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
         </div>
         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
           BRF Organisationsnummer *
          </label>
          <input
           type="text"
           value={brfOrgNumber}
           onChange={(e) => setBrfOrgNumber(e.target.value)}
           placeholder="556XXX-XXXX"
           className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           required={propertyType === 'BRF'}
          />
         </div>
        </div>
       )}
      </div>

      {/* C. ARBETSUPPGIFTER */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary-500" />
        C. Arbetsuppgifter
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Arbetstyp *
         </label>
         <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          required
         >
          <option value="">Välj arbetstyp...</option>
          {WORK_TYPES.map((t) => (
           <option key={t.value} value={t.value}>{t.label}</option>
          ))}
         </select>
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Startdatum *
         </label>
         <input
          type="date"
          value={workStartDate}
          onChange={(e) => setWorkStartDate(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          required
         />
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Slutdatum *
         </label>
         <input
          type="date"
          value={workEndDate}
          onChange={(e) => setWorkEndDate(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          required
         />
        </div>
       </div>
      </div>

      {/* D. KOSTNADSBESKRIVNING */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-primary-500" />
        D. Kostnadsbeskrivning
       </h2>

       <p className="text-sm text-gray-500 mb-4">
        Specificera arbetskostnader (endast arbete räknas för ROT-avdrag)
       </p>

       <div className="space-y-3">
        {workDetails.map((detail, idx) => (
         <div key={idx} className="flex gap-2 items-start">
          <input
           type="text"
           value={detail.description}
           onChange={(e) => updateWorkDetail(idx, 'description', e.target.value)}
           placeholder="Beskrivning (t.ex. Rivning, Målning)"
           className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          />
          <input
           type="number"
           value={detail.hours || ''}
           onChange={(e) => updateWorkDetail(idx, 'hours', Number(e.target.value))}
           placeholder="Tim"
           className="w-20 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
           min="0"
          />
          <input
           type="number"
           value={detail.hourlyRate || ''}
           onChange={(e) => updateWorkDetail(idx, 'hourlyRate', Number(e.target.value))}
           placeholder="kr/tim"
           className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
           min="0"
          />
          <div className="w-28 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-right">
           {detail.total.toLocaleString('sv-SE')} kr
          </div>
          {workDetails.length > 1 && (
           <button
            type="button"
            onClick={() => removeWorkDetail(idx)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
           >
            <Trash2 className="w-4 h-4" />
           </button>
          )}
         </div>
        ))}
       </div>

       <button
        type="button"
        onClick={addWorkDetail}
        className="mt-3 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
       >
        <Plus className="w-4 h-4" />
        Lägg till rad
       </button>

       <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
         <span className="text-gray-600 dark:text-gray-400">Summa arbete:</span>
         <span className="font-semibold">{workCostTotal.toLocaleString('sv-SE')} kr</span>
        </div>
       </div>

       <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
         Materialkostnad (räknas EJ för ROT)
        </label>
        <input
         type="number"
         value={materialCost}
         onChange={(e) => setMaterialCost(e.target.value)}
         placeholder="0"
         className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         min="0"
        />
       </div>
      </div>

      {/* E. ROT-BERÄKNING */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
       <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
        E. ROT-beräkning (automatisk)
       </h2>

       <div className="space-y-2 text-sm">
        <div className="flex justify-between">
         <span className="text-gray-700 dark:text-gray-300">Arbetskostnad:</span>
         <span className="font-medium">{workCostTotal.toLocaleString('sv-SE')} kr</span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-700 dark:text-gray-300">ROT-avdrag (50%):</span>
         <span className="font-medium">{(workCostTotal * deductionRate).toLocaleString('sv-SE')} kr</span>
        </div>
        {isOverLimit && (
         <div className="flex justify-between text-red-600 dark:text-red-400">
          <span>Begränsat till årsgräns:</span>
          <span className="font-medium">{potentialDeduction.toLocaleString('sv-SE')} kr</span>
         </div>
        )}
        <div className="pt-2 border-t border-green-300 dark:border-green-700 flex justify-between text-lg font-bold">
         <span className="text-green-800 dark:text-green-200">Kunden får tillbaka:</span>
         <span className="text-green-700 dark:text-green-300">{potentialDeduction.toLocaleString('sv-SE')} kr</span>
        </div>
       </div>
      </div>

      {/* F. KUNDENS DEKLARATION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-primary-500" />
        F. Kundens deklaration
       </h2>

       <p className="text-sm text-gray-500 mb-4">
        Kunden intygar att följande gäller:
       </p>

       <div className="space-y-3">
        {[
         { key: 'isOwner', label: 'Jag är ägare/bostadsrättshavare till bostaden' },
         { key: 'isPrivateResidence', label: 'Arbetet utfördes på min privatbostad' },
         { key: 'isRepairWork', label: 'Arbetet är reparation/ombyggnad/tillbyggnad' },
         { key: 'isCertifiedCompany', label: 'Fakturan är från företag med F-skatt' },
         { key: 'willDeclare', label: 'Jag kommer deklarera detta vid inkomstdeklarationen' },
        ].map((item) => (
         <label key={item.key} className="flex items-center gap-3 cursor-pointer">
          <input
           type="checkbox"
           checked={declarations[item.key as keyof typeof declarations]}
           onChange={(e) => setDeclarations(prev => ({ ...prev, [item.key]: e.target.checked }))}
           className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
         </label>
        ))}
       </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
       <button
        type="submit"
        disabled={loading || isOverLimit}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
       >
        {loading ? (
         <>
          <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          Sparar...
         </>
        ) : (
         'Skapa ROT-ansökan'
        )}
       </button>
       <button
        type="button"
        onClick={() => router.back()}
        className="px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
       >
        Avbryt
       </button>
      </div>
     </form>
    </div>
   </main>
  </div>
 )
}
