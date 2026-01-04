'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'

interface Client {
 id: string
 name: string
 email?: string
 address?: string
 org_number?: string
 phone?: string
}

export default function EditClientPage() {
 const router = useRouter()
 const params = useParams()
 const { tenantId } = useTenant()
 const { isAdmin, loading: adminLoading } = useAdmin()
 const clientId = params?.id as string

 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [clientType, setClientType] = useState<'company' | 'private'>('company')
 const [name, setName] = useState('')
 const [email, setEmail] = useState('')
 const [address, setAddress] = useState('')
 const [orgNumber, setOrgNumber] = useState('')
 const [phone, setPhone] = useState('')

 useEffect(() => {
  if (!clientId || !tenantId) {
   if (!tenantId) {
    return // Wait for tenantId
   }
   setLoading(false)
   return
  }

  // CRITICAL: Wait for admin check to complete before checking isAdmin
  if (adminLoading) {
   return // Still loading admin status, wait...
  }

  // Now check admin status after loading is complete
  if (!isAdmin) {
   toast.error('Endast admin kan redigera kunder')
   router.push(`/clients/${clientId}`)
   return
  }

  async function fetchClient() {
   try {
    let { data: clientData, error: clientError } = await supabase
     .from('clients')
     .select('id, name, email, address, org_number, phone')
     .eq('id', clientId)
     .eq('tenant_id', tenantId)
     .single()

    // Fallback if columns don't exist
    if (clientError && (clientError.code === '42703' || clientError.code === '400')) {
     const fallback = await supabase
      .from('clients')
      .select('id, name, email, address')
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .single()
     
     if (!fallback.error && fallback.data) {
      clientData = { ...fallback.data, org_number: null, phone: null }
      clientError = null
     }
    }

    if (clientError || !clientData) {
     toast.error('Kunde inte hämta kund')
     router.push(`/clients/${clientId}`)
     return
    }

    // Populate form with client data
    setName(clientData.name || '')
    setEmail(clientData.email || '')
    setAddress(clientData.address || '')
    setOrgNumber(clientData.org_number || '')
    setPhone(clientData.phone || '')
    setClientType(clientData.org_number ? 'company' : 'private')
   } catch (err: any) {
    console.error('Error fetching client:', err)
    toast.error('Ett fel uppstod: ' + err.message)
    router.push(`/clients/${clientId}`)
   } finally {
    setLoading(false)
   }
  }

  fetchClient()
 }, [clientId, tenantId, router, isAdmin, adminLoading])

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setSaving(true)

  if (!tenantId) {
   toast.error('Ingen tenant satt. Logga in eller välj tenant först.')
   setSaving(false)
   return
  }

  // Double-check admin status before submitting (also checks if still loading)
  if (adminLoading) {
   toast.error('Väntar på admin-kontroll...')
   setSaving(false)
   return
  }

  if (!isAdmin) {
   toast.error('Endast admin kan redigera kunder')
   setSaving(false)
   return
  }

  try {
   // Update client via API route
   const updateRes = await fetch(`/api/clients/${clientId}/update`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     tenantId,
     name,
     email: email || null,
     address: address || null,
     orgNumber: clientType === 'company' ? (orgNumber || null) : null,
     phone: phone || null,
    }),
   })

   if (!updateRes.ok) {
    const errorData = await updateRes.json().catch(() => ({}))
    throw new Error(errorData.error || 'Kunde inte uppdatera kund')
   }

   toast.success('Kund uppdaterad!')
   router.push(`/clients/${clientId}`)
  } catch (err: any) {
   console.error('Error updating client:', err)
   toast.error('Kunde inte uppdatera kund: ' + err.message)
   setSaving(false)
  }
 }

 // Show loading if admin check is still loading OR if client data is loading
 if (adminLoading || loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-gray-500 dark:text-gray-400">
      {adminLoading ? 'Kontrollerar admin-behörighet...' : 'Laddar kunddata...'}
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
     <div className="mb-6 sm:mb-8">
      <button
       onClick={() => router.push(`/clients/${clientId}`)}
       className="mb-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 transition-colors"
      >
       ← Tillbaka
      </button>
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Redigera kund</h1>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Uppdatera kundinformation</p>
     </div>

     <form
      className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700"
      onSubmit={handleSubmit}
     >
      <div className="space-y-6">
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Typ *
        </label>
        <div className="grid grid-cols-2 gap-3">
         <button
          type="button"
          onClick={() => {
           setClientType('company')
           if (clientType === 'private') {
            setOrgNumber('')
           }
          }}
          className={`px-4 py-3 rounded-[8px] border-2 font-semibold transition-all ${
           clientType === 'company'
            ? 'bg-primary-500 hover:bg-primary-600 text-white border-transparent shadow-md'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
         >
          Företag
         </button>
         <button
          type="button"
          onClick={() => {
           setClientType('private')
           setOrgNumber('')
          }}
          className={`px-4 py-3 rounded-[8px] border-2 font-semibold transition-all ${
           clientType === 'private'
            ? 'bg-primary-500 hover:bg-primary-600 text-white border-transparent shadow-md'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
         >
          Privat
         </button>
        </div>
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         {clientType === 'company' ? 'Företagsnamn *' : 'Namn *'}
        </label>
        <input
         type="text"
         value={name}
         onChange={(e) => setName(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
         placeholder={clientType === 'company' ? 'Företagsnamn' : 'För- och efternamn'}
         required
        />
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         E-post
        </label>
        <input
         type="email"
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
         placeholder="kund@exempel.se"
        />
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Telefon
        </label>
        <input
         type="tel"
         value={phone}
         onChange={(e) => setPhone(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
         placeholder="070-123 45 67"
        />
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Adress
        </label>
        <input
         type="text"
         value={address}
         onChange={(e) => setAddress(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
         placeholder="Gatadress, Postnummer Stad"
        />
       </div>

       {clientType === 'company' && (
        <div>
         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Organisationsnummer *
         </label>
         <input
          type="text"
          value={orgNumber}
          onChange={(e) => setOrgNumber(e.target.value)}
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
          placeholder="556677-8899"
          required={clientType === 'company'}
         />
        </div>
       )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 mt-6 sm:mt-8">
       <button
        type="submit"
        disabled={saving}
        className="w-full sm:flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-3 sm:py-4 font-bold text-base sm:text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
       >
        {saving ? (
         <span className="flex items-center justify-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Sparar...
         </span>
        ) : (
         'Spara ändringar'
        )}
       </button>
       <button
        type="button"
        onClick={() => router.push(`/clients/${clientId}`)}
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

