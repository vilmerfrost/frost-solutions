'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FrostLogo from '@/components/FrostLogo'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import supabase from '@/utils/supabase/supabaseClient'
import { BASE_PATH } from '@/utils/url'
import { apiFetch } from '@/lib/http/fetcher'
import type { PriceModel } from '@/types/supabase'

export default function NewProjectPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 
 // Basic info
 const [name, setName] = useState('')
 const [clientId, setClientId] = useState<string>('')
 const [siteAddress, setSiteAddress] = useState('')
 const [description, setDescription] = useState('')
 
 // Pricing
 const [priceModel, setPriceModel] = useState<PriceModel>('hourly')
 const [baseRate, setBaseRate] = useState('360')
 const [budget, setBudget] = useState(0)
 const [markupPercent, setMarkupPercent] = useState('10')
 
 // Dates
 const [startDate, setStartDate] = useState('')
 const [endDate, setEndDate] = useState('')
 
 // ROT/RUT
 const [isRotRut, setIsRotRut] = useState(false)
 const [propertyDesignation, setPropertyDesignation] = useState('')
 const [apartmentNumber, setApartmentNumber] = useState('')
 
 // Data
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

  if (isRotRut && !propertyDesignation) {
   toast.error('Fastighetsbeteckning krävs för ROT-avdrag')
   return
  }

  setLoading(true)
  
  const selectedClient = clients.find(c => c.id === clientId)
  const customerName = selectedClient?.name || ''

  try {
   const json = await apiFetch<{ id?: string; data?: { id?: string }; error?: string }>('/api/create-project', {
    method: 'POST',
    body: JSON.stringify({
     name: name,
     tenant_id: tenantId,
     client_id: clientId,
     customer_name: customerName,
     base_rate_sek: Number(baseRate) || 360,
     budgeted_hours: budget,
     // New fields
     price_model: priceModel,
     markup_percent: Number(markupPercent) || 10,
     site_address: siteAddress || null,
     description: description || null,
     start_date: startDate || null,
     end_date: endDate || null,
     // ROT fields
     is_rot_rut: isRotRut,
     property_designation: isRotRut ? propertyDesignation : null,
     apartment_number: isRotRut && apartmentNumber ? apartmentNumber : null,
    }),
   })

   const error = json?.error

   setLoading(false)

   if (error) {
    console.error('Supabase insert error (project)', error)
    toast.error('Kunde inte skapa projekt: ' + (typeof error === 'string' ? error : JSON.stringify(error)))
    return
   }
   
   toast.success('Projekt skapat!')

   const projectId = json.id || json.data?.id
   if (projectId) {
    window.dispatchEvent(new CustomEvent('projectCreated', { 
     detail: { 
      projectId: projectId,
      timestamp: Date.now() 
     } 
    }))
   }

   router.replace('/projects')
  } catch (err: any) {
   console.error('Error creating project:', err)
   toast.error('Kunde inte skapa projekt: ' + (err.message || 'Okänt fel'))
  } finally {
   setLoading(false)
  }
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <div className="hidden lg:block">
    <Sidebar />
   </div>
   <main className="flex-1 w-full flex items-start justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto">
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6 sm:p-8 my-4">
     <div className="flex items-center gap-3 mb-6">
      <FrostLogo size={32}/>
      <div className="font-bold text-xl text-gray-900 dark:text-white">Nytt projekt</div>
     </div>

     <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Section: Basic Info */}
      <div className="space-y-4">
       <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Grundinformation</h3>
       
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Projektnamn *</label>
        <input 
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
         value={name} 
         onChange={e => setName(e.target.value)} 
         required 
         placeholder="T.ex. Renovering Kök Storgatan 4"
        />
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

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Objektsadress <span className="text-xs text-gray-400 font-normal">(var jobbet utförs)</span>
        </label>
        <input 
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
         value={siteAddress} 
         onChange={e => setSiteAddress(e.target.value)} 
         placeholder="Storgatan 4, 123 45 Stockholm"
        />
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Beskrivning <span className="text-xs text-gray-400 font-normal">(portkod, nycklar, etc.)</span>
        </label>
        <textarea 
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base resize-none"
         rows={2}
         value={description} 
         onChange={e => setDescription(e.target.value)} 
         placeholder="Interna noteringar..."
        />
       </div>
      </div>

      {/* Section: Pricing */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
       <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prismodell</h3>
       
       <div className="grid grid-cols-3 gap-2">
        {[
         { value: 'hourly', label: 'Löpande räkning', desc: 'Timdebitering' },
         { value: 'fixed', label: 'Fast pris', desc: 'Avtalat pris' },
         { value: 'budget', label: 'Budget', desc: 'Estimat' },
        ].map((option) => (
         <button
          key={option.value}
          type="button"
          onClick={() => setPriceModel(option.value as PriceModel)}
          className={`p-3 rounded-[8px] border-2 text-left transition-all ${
           priceModel === option.value
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
         >
          <div className={`text-sm font-semibold ${priceModel === option.value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
           {option.label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
         </button>
        ))}
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timpris (SEK) *</label>
         <input 
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
          type="number" 
          value={baseRate} 
          onChange={e => setBaseRate(e.target.value)} 
          required 
          min={1} 
          placeholder="360"
         />
        </div>
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {priceModel === 'fixed' ? 'Avtalade timmar' : 'Budget (timmar)'} 
          <span className="text-xs text-gray-400 font-normal ml-1">(valfritt)</span>
         </label>
         <input 
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
          type="number" 
          value={budget} 
          onChange={e => setBudget(Number(e.target.value))} 
          min={0} 
          placeholder="T.ex. 60"
         />
        </div>
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Materialpåslag (%) <span className="text-xs text-gray-400 font-normal">(valfritt)</span>
        </label>
        <input 
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
         type="number" 
         value={markupPercent} 
         onChange={e => setMarkupPercent(e.target.value)} 
         min={0} 
         max={100}
         step={0.5}
         placeholder="10"
        />
       </div>
      </div>

      {/* Section: Dates */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
       <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Period</h3>
       
       <div className="grid grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Startdatum</label>
         <input 
          type="date"
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
          value={startDate} 
          onChange={e => setStartDate(e.target.value)}
         />
        </div>
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Slutdatum</label>
         <input 
          type="date"
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
          value={endDate} 
          onChange={e => setEndDate(e.target.value)}
         />
        </div>
       </div>
      </div>

      {/* Section: ROT/RUT */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
       <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ROT-avdrag</h3>
        <label className="relative inline-flex items-center cursor-pointer">
         <input 
          type="checkbox" 
          checked={isRotRut} 
          onChange={e => setIsRotRut(e.target.checked)}
          className="sr-only peer"
         />
         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
        </label>
       </div>

       {isRotRut && (
        <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-[8px] border border-green-200 dark:border-green-800">
         <p className="text-sm text-green-700 dark:text-green-300">
          ROT-avdrag kräver fastighetsbeteckning för att kunna skickas till Skatteverket.
         </p>
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Fastighetsbeteckning *
          </label>
          <input 
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
           value={propertyDesignation} 
           onChange={e => setPropertyDesignation(e.target.value)} 
           required={isRotRut}
           placeholder="T.ex. Sätra 4:22"
          />
         </div>
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Lägenhetsnummer <span className="text-xs text-gray-400 font-normal">(för BRF)</span>
          </label>
          <input 
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
           value={apartmentNumber} 
           onChange={e => setApartmentNumber(e.target.value)} 
           placeholder="T.ex. 1201"
          />
         </div>
        </div>
       )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
       <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] font-bold py-3 px-6 shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
