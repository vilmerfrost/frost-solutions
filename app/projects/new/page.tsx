'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FrostLogo from '@/components/FrostLogo'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import supabase from '@/utils/supabase/supabaseClient'
import { BASE_PATH } from '@/utils/url'

export default function NewProjectPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [name, setName] = useState('')
 const [clientId, setClientId] = useState<string>('')
 const [baseRate, setBaseRate] = useState('360')
 const [budget, setBudget] = useState(0)
 const [clients, setClients] = useState<Array<{ id: string; name: string; org_number?: string }>>([])
 const [loading, setLoading] = useState(false)

 useEffect(() => {
  async function fetchClients() {
   if (!tenantId) return

   try {
    const { data: clientsData } = await supabase
     .from('clients')
     .select('id, name, org_number')
     .eq('tenant_id', tenantId)
     .order('name', { ascending: true })

    if (clientsData) {
     setClients(clientsData)
    }
   } catch (err) {
    console.error('Error fetching clients:', err)
   }
  }

  if (tenantId) {
   fetchClients()
  }
 }, [tenantId])
 
 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  
  if (!clientId) {
   toast.error('Välj en kund för projektet')
   return
  }

  setLoading(true)
  
  // Get client name for backward compatibility
  const selectedClient = clients.find(c => c.id === clientId)
  const customerName = selectedClient?.name || ''

  // Use client helper that injects tenant into headers and JSON body
  const res = await fetch('/api/create-project', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
    name: name,
    tenant_id: tenantId,
    client_id: clientId,
    customer_name: customerName,
    base_rate_sek: Number(baseRate) || 360,
    budgeted_hours: budget,
   }),
  })

  const json = await res.json()
  const error = json?.error

  setLoading(false)

  if (error) {
   console.error('Supabase insert error (project)', error)
   toast.error('Kunde inte skapa projekt: ' + (error.message ?? JSON.stringify(error)))
   return
  }
  
  toast.success('Projekt skapat!')

  // Dispatch event so dashboard can refresh
  const projectId = json.id || json.data?.id
  if (projectId) {
   window.dispatchEvent(new CustomEvent('projectCreated', { 
    detail: { 
     projectId: projectId,
     timestamp: Date.now() 
    } 
   }))
  }

  // Redirect to projects list so server-side list refreshes
  router.replace('/projects')
 }
 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <div className="hidden lg:block">
    <Sidebar />
   </div>
   <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 lg:p-10">
    <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md border border-gray-100 dark:border-gray-700 p-6 sm:p-8 lg:p-10">
     <div className="flex items-center gap-3 mb-6">
      <FrostLogo size={32}/>
      <div className="font-bold text-xl text-gray-900 dark:text-white dark:text-white">Nytt projekt</div>
     </div>

     {/* AI KMA Suggestion - DISABLED FOR V1.0 */}
     {/* {name && (
      <div className="mb-6">
       <KMAIISuggestion projectType={name.toLowerCase().includes('elektriker') ? 'elektriker' : name.toLowerCase().includes('rörmokare') ? 'rörmokare' : name.toLowerCase().includes('målare') ? 'målare' : 'bygg'} />
      </div>
     )} */}

     {/* Note: AI Projektplanering visas på projekt-detaljsidan efter att projektet är skapat */}

     <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Projektnamn *</label>
       <input 
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
        value={name} onChange={e=>setName(e.target.value)} required placeholder="T.ex. Villa Ekbacken"/>
      </div>
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kund *</label>
       <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
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
      <div className="grid grid-cols-2 gap-4">
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timpris (SEK) *</label>
        <input 
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
         type="number" value={baseRate} onChange={e=>setBaseRate(e.target.value)} required min={1} placeholder="360"/>
       </div>
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Budget (timmar) <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">(valfritt)</span></label>
        <input 
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
         type="number" value={budget} onChange={e=>setBudget(Number(e.target.value))} min={0} placeholder="T.ex. 60"/>
       </div>
      </div>
      <div className="flex gap-3 mt-2">
       <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] font-bold py-3 px-6 shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
       >
        {loading ? (
         <span className="flex items-center justify-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Sparar...
         </span>
        ) : (
         'Skapa projekt'
        )}
       </button>
       <button
        type="button"
        onClick={() => router.back()}
        className="px-6 py-3 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
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


