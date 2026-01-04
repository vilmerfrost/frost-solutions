'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'

interface Project {
 id: string
 name: string
 client_id?: string
}

interface Client {
 id: string
 name: string
}

export default function NewRotApplicationPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const { isAdmin, loading: adminLoading } = useAdmin()
 const [loading, setLoading] = useState(false)
 const [loadingData, setLoadingData] = useState(true)
 
 // Form data
 const [projectId, setProjectId] = useState('')
 const [clientId, setClientId] = useState('')
 const [customerPersonNumber, setCustomerPersonNumber] = useState('')
 const [propertyDesignation, setPropertyDesignation] = useState('')
 const [workType, setWorkType] = useState('')
 const [workCost, setWorkCost] = useState('')
 const [materialCost, setMaterialCost] = useState('')
 
 // Data
 const [projects, setProjects] = useState<Project[]>([])
 const [clients, setClients] = useState<Client[]>([])

 useEffect(() => {
  if (!tenantId) {
   setLoadingData(false)
   return
  }

  async function loadData() {
   try {
    if (!tenantId) return
    
    // Load projects - filter out completed and archived projects
    const { data: projectsData } = await supabase
     .from('projects')
     .select('id, name, client_id, status')
     .eq('tenant_id', tenantId)
     .order('name')

    // Filter out completed and archived projects on client-side
    const activeProjects = (projectsData || []).filter(
     (p: any) => p.status !== 'completed' && p.status !== 'archived'
    )

    // Load clients
    const { data: clientsData } = await supabase
     .from('clients')
     .select('id, name')
     .eq('tenant_id', tenantId)
     .order('name')

    setProjects(activeProjects)
    setClients(clientsData || [])
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

 // Validate Swedish person number (YYYYMMDD-XXXX or YYYYMMDDXXXX)
 function validatePersonNumber(pnr: string): boolean {
  const clean = pnr.replace(/[-\s]/g, '')
  if (clean.length !== 12) return false
  
  // Check format: YYYYMMDDXXXX
  const regex = /^\d{12}$/
  if (!regex.test(clean)) return false
  
  // Basic validation: check date
  const year = parseInt(clean.substring(0, 4))
  const month = parseInt(clean.substring(4, 6))
  const day = parseInt(clean.substring(6, 8))
  
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1900 || year > new Date().getFullYear()) return false
  
  return true
 }

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  if (!isAdmin) {
   toast.error('Endast administratörer kan skapa ROT-ansökningar. Kontakta en administratör.')
   return
  }

  if (!tenantId) {
   toast.error('Ingen tenant vald. Logga in först.')
   return
  }

  // Validate person number
  if (!validatePersonNumber(customerPersonNumber)) {
   toast.error('Ogiltigt personnummer. Använd formatet YYYYMMDD-XXXX eller YYYYMMDDXXXX.')
   return
  }

  // Validate costs
  const work = parseFloat(workCost)
  const material = parseFloat(materialCost || '0')
  
  if (isNaN(work) || work <= 0) {
   toast.error('Arbetskostnad måste vara ett positivt belopp.')
   return
  }

  if (isNaN(material) || material < 0) {
   toast.error('Materialkostnad måste vara ett positivt belopp eller 0.')
   return
  }

  const totalCost = work + material

  setLoading(true)

  try {
   const { data: userData } = await supabase.auth.getUser()
   const userId = userData?.user?.id

   if (!userId) {
    toast.error('Du är inte inloggad.')
    setLoading(false)
    return
   }

   // Create ROT application via API route
   const response = await fetch('/api/rot/create', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     tenant_id: tenantId,
     project_id: projectId || null,
     client_id: clientId || null,
     customer_person_number: customerPersonNumber,
     property_designation: propertyDesignation,
     work_type: workType,
     work_cost_sek: work,
     material_cost_sek: material,
     total_cost_sek: totalCost,
    }),
   })

   const result = await response.json()

   if (!response.ok || result.error) {
    console.error('Error creating ROT application:', result)
    
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
    
    toast.error('Kunde inte skapa ROT-ansökan: ' + errorMessage)
    setLoading(false)
    return
   }

   toast.success('ROT-ansökan skapad! Du kan nu skicka den till Skatteverket.')
   router.push(`/rot/${result.data.id}`)
  } catch (err: any) {
   console.error('Unexpected error:', err)
   toast.error('Ett oväntat fel uppstod: ' + (err.message || 'Okänt fel'))
   setLoading(false)
  }
 }

 if (loadingData || adminLoading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden flex items-center justify-center">
     <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
    </main>
   </div>
  )
 }

 // Redirect non-admins
 if (!isAdmin) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden flex items-center justify-center">
     <div className="bg-blue-50 dark:bg-blue-900/20 rounded-[8px] p-6 border border-blue-200 dark:border-blue-800 max-w-md text-center">
      <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
       🔒 Åtkomst begränsad
      </p>
      <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
       Endast administratörer kan skapa ROT-ansökningar. Kontakta en administratör för att begära en ROT-ansökan.
      </p>
      <button
       onClick={() => router.push('/rot')}
       className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-[8px] font-semibold shadow-md hover:shadow-xl transition-all"
      >
       Tillbaka till ROT-ansökningar
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
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
     {/* Work in Progress Notice */}
     <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-[8px] sm:rounded-[8px] p-4 sm:p-6">
      <div className="flex items-start gap-3">
       <span className="text-2xl">🚧</span>
       <div>
        <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-1">Work in Progress</h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
         ROT-avdrag funktionen är under utveckling. Vissa funktioner kan saknas eller fungera ofullständigt.
        </p>
       </div>
      </div>
     </div>

     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
       Ny ROT-ansökan
      </h1>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
       Fyll i ROT-avdrag enligt Skatteverkets blankett SKV 5017
      </p>
     </div>

     <form
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 space-y-6"
     >
      {/* Projekt */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Projekt (valfritt)
       </label>
       <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
       >
        <option value="">Välj projekt...</option>
        {projects.map((proj) => (
         <option key={proj.id} value={proj.id}>
          {proj.name}
         </option>
        ))}
       </select>
      </div>

      {/* Kund */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Kund *
       </label>
       <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
        required
       >
        <option value="">Välj kund...</option>
        {clients.map((client) => (
         <option key={client.id} value={client.id}>
          {client.name}
         </option>
        ))}
       </select>
      </div>

      {/* Personnummer */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Kundens personnummer *
       </label>
       <input
        type="text"
        value={customerPersonNumber}
        onChange={(e) => setCustomerPersonNumber(e.target.value)}
        placeholder="YYYYMMDD-XXXX eller YYYYMMDDXXXX"
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
        required
       />
       <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Format: YYYYMMDD-XXXX eller YYYYMMDDXXXX
       </p>
      </div>

      {/* Fastighetsbeteckning */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Fastighetsbeteckning *
       </label>
       <input
        type="text"
        value={propertyDesignation}
        onChange={(e) => setPropertyDesignation(e.target.value)}
        placeholder="t.ex. ÖSTRA ÄNGEGÅRDEN 1:1"
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
        required
       />
      </div>

      {/* Arbetstyp */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Arbetstyp *
       </label>
       <select
        value={workType}
        onChange={(e) => setWorkType(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
        required
       >
        <option value="">Välj arbetstyp...</option>
        <option value="renovering">Renovering</option>
        <option value="reparation">Reparation</option>
        <option value="underhåll">Underhåll</option>
        <option value="byggnad">Byggnad</option>
        <option value="tillbyggnad">Tillbyggnad</option>
        <option value="anläggning">Anläggning</option>
       </select>
      </div>

      {/* Arbetskostnad */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Arbetskostnad (SEK) *
       </label>
       <input
        type="number"
        value={workCost}
        onChange={(e) => setWorkCost(e.target.value)}
        min="0"
        step="0.01"
        placeholder="0.00"
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
        required
       />
      </div>

      {/* Materialkostnad */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Materialkostnad (SEK)
       </label>
       <input
        type="number"
        value={materialCost}
        onChange={(e) => setMaterialCost(e.target.value)}
        min="0"
        step="0.01"
        placeholder="0.00"
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
       />
       <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Endast arbetskostnaden är ROT-avdragsgill. Materialkostnad kan inkluderas för dokumentation.
       </p>
      </div>

      {/* Totalkostnad preview */}
      {workCost && (
       <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-[8px] border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-center">
         <span className="font-semibold text-gray-700 dark:text-gray-300">Totalkostnad:</span>
         <span className="font-bold text-lg text-gray-900 dark:text-white">
          {((parseFloat(workCost) || 0) + (parseFloat(materialCost || '0') || 0)).toLocaleString('sv-SE', {
           style: 'currency',
           currency: 'SEK',
          })}
         </span>
        </div>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
         ROT-avdrag: 30% av arbetskostnaden (max 75 000 kr per år)
        </p>
       </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
       <button
        type="submit"
        disabled={loading}
        className="w-full sm:flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-3 sm:py-4 font-bold text-base sm:text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
       >
        {loading ? (
         <span className="flex items-center justify-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Sparar...
         </span>
        ) : (
         'Skapa ROT-ansökan'
        )}
       </button>
       <button
        type="button"
        onClick={() => router.back()}
        className="w-full sm:w-auto px-6 py-3 sm:py-4 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all text-sm sm:text-base"
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

