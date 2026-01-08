'use client'

import React, { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Briefcase, User, Calendar, DollarSign, Clock, X, Loader } from 'lucide-react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'

interface Client {
 id: string
 name: string
 org_number?: string | null
}

interface NewProjectModalProps {
 isOpen: boolean
 onClose: () => void
 onSuccess?: () => void
}

export function NewProjectModal({ isOpen, onClose, onSuccess }: NewProjectModalProps) {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [name, setName] = useState('')
 const [clientId, setClientId] = useState('')
 const [baseRate, setBaseRate] = useState('360')
 const [budget, setBudget] = useState('')
 const [clients, setClients] = useState<Client[]>([])
 const [loading, setLoading] = useState(false)
 const [loadingClients, setLoadingClients] = useState(true)

 useEffect(() => {
  async function fetchClients() {
   if (!tenantId) return

   setLoadingClients(true)
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
    toast.error('Kunde inte ladda kunder')
   } finally {
    setLoadingClients(false)
   }
  }

  if (isOpen && tenantId) {
   fetchClients()
  }
 }, [isOpen, tenantId])

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!clientId) {
   toast.error('Välj en kund för projektet')
   return
  }

  setLoading(true)

  try {
   const selectedClient = clients.find((c) => c.id === clientId)
   const customerName = selectedClient?.name || ''

   const res = await fetch('/api/create-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     name: name,
     tenant_id: tenantId,
     client_id: clientId,
     customer_name: customerName,
     base_rate_sek: Number(baseRate) || 360,
     budgeted_hours: budget ? Number(budget) : null,
    }),
   })

   const json = await res.json()
   const error = json?.error

   if (error) {
    console.error('Supabase insert error (project)', error)
    toast.error('Kunde inte skapa projekt: ' + (error.message ?? JSON.stringify(error)))
    return
   }

   toast.success('Projekt skapat!')

   // Dispatch event so dashboard can refresh
   const projectId = json.id || json.data?.id
   if (projectId) {
    window.dispatchEvent(
     new CustomEvent('projectCreated', {
      detail: {
       projectId: projectId,
       timestamp: Date.now(),
      },
     })
    )
   }

   // Reset form
   setName('')
   setClientId('')
   setBaseRate('360')
   setBudget('')

   // Call success callback
   onSuccess?.()

   // Close modal
   onClose()

   // Optionally navigate to project
   if (projectId) {
    router.push(`/projects/${projectId}`)
   }
  } catch (err: any) {
   console.error('Error creating project:', err)
   toast.error('Ett fel uppstod: ' + err.message)
  } finally {
   setLoading(false)
  }
 }

 // Calculate budget preview
 const budgetHours = Number(budget) || 0
 const rate = Number(baseRate) || 360
 const budgetTotal = budgetHours * rate

 return (
  <Dialog
   open={isOpen}
   onClose={onClose}
   maxWidth="3xl"
   title={
    <div className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
     <Briefcase className="w-6 h-6 text-primary-500" />
     Nytt projekt
    </div>
   }
   footer={
    <div className="flex gap-3 w-full">
     <Button
      type="button"
      variant="outline"
      onClick={onClose}
      className="flex-1"
     >
      <X className="w-4 h-4 mr-2" />
      Avbryt
     </Button>
     <Button
      type="submit"
      disabled={loading}
      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
      onClick={(e) => {
       e.preventDefault()
       const form = e.currentTarget.closest('form')
       if (form) {
        form.requestSubmit()
       }
      }}
     >
      {loading ? (
       <>
        <Loader className="w-4 h-4 mr-2 animate-spin" />
        Sparar...
       </>
      ) : (
       <>
        <Briefcase className="w-4 h-4 mr-2" />
        Skapa projekt
       </>
      )}
     </Button>
    </div>
   }
  >
   <div className="max-w-3xl">
    <p className="text-gray-600 dark:text-gray-400 mb-6">
     Skapa ett nytt projekt och börja spåra tid och kostnader
    </p>
    <form onSubmit={handleSubmit} className="space-y-6">
     {/* Project Name */}
     <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
       <Briefcase className="w-4 h-4 text-primary-500" />
       Projektnamn *
      </label>
      <input
       className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
       value={name}
       onChange={(e) => setName(e.target.value)}
       required
       placeholder="T.ex. Villa Ekbacken"
      />
     </div>

     {/* Client Selection */}
     <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
       <User className="w-4 h-4 text-blue-600" />
       Kund *
      </label>
      {loadingClients ? (
       <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-primary-500" />
       </div>
      ) : (
       <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
        required
       >
        <option value="">Välj kund...</option>
        {clients.map((client) => (
         <option key={client.id} value={client.id}>
          {client.name} {client.org_number ? `(${client.org_number})` : ''}
         </option>
        ))}
       </select>
      )}
      {!loadingClients && clients.length === 0 && (
       <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Inga kunder hittades.{' '}
        <a
         href="/clients/new"
         className="text-primary-500 dark:text-primary-400 hover:underline"
         onClick={(e) => {
          e.preventDefault()
          onClose()
          router.push('/clients/new')
         }}
        >
         Lägg till kund
        </a>
       </p>
      )}
     </div>

     {/* Rate and Budget Grid */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Hourly Rate */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-600" />
        Timpris (SEK) *
       </label>
       <input
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
        type="number"
        value={baseRate}
        onChange={(e) => setBaseRate(e.target.value)}
        required
        min={1}
        placeholder="360"
       />
      </div>

      {/* Budget Hours */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
        <Clock className="w-4 h-4 text-orange-600" />
        Budget (timmar)
        <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">(valfritt)</span>
       </label>
       <input
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-500 text-base"
        type="number"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        min={0}
        placeholder="T.ex. 60"
       />
      </div>
     </div>

     {/* Budget Preview */}
     {budgetHours > 0 && (
      <div className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-700 rounded-[8px] p-4">
       <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-5 h-5 text-primary-500 dark:text-primary-400" />
        <span className="font-semibold text-gray-900 dark:text-white">Budgetberäkning</span>
       </div>
       <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
        {budgetHours.toLocaleString('sv-SE')} timmar × {rate.toLocaleString('sv-SE')} kr ={' '}
        {budgetTotal.toLocaleString('sv-SE')} kr
       </p>
      </div>
     )}

    </form>
   </div>
  </Dialog>
 )
}

