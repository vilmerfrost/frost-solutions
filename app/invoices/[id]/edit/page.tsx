'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { extractErrorMessage } from '@/lib/errorUtils'
import type { Invoice } from '@/types/supabase'

export default function EditInvoicePage() {
 const router = useRouter()
 const params = useParams()
 const { tenantId } = useTenant()
 const { isAdmin, loading: adminLoading } = useAdmin()
 const invoiceId = params?.id as string
 
 const [invoice, setInvoice] = useState<Invoice | null>(null)
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)

 useEffect(() => {
  if (!invoiceId || !tenantId) {
   setLoading(false)
   return
  }

  async function fetchInvoice() {
   try {
    // Progressive fallback for missing columns
    let { data, error } = await supabase
     .from('invoices')
     .select('id, amount, customer_name, desc, description, status, issue_date, due_date, project_id, customer_id, client_id')
     .eq('id', invoiceId)
     .eq('tenant_id', tenantId)
     .single()

    // Fallback if desc or other columns don't exist
    if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
     // Try without desc
     const fallback1 = await supabase
      .from('invoices')
      .select('id, amount, customer_name, description, status, issue_date, due_date, project_id, customer_id, client_id')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single()
     
     if (!fallback1.error && fallback1.data) {
      data = { ...fallback1.data, desc: fallback1.data.description || null }
      error = null
     } else if (fallback1.error && (fallback1.error.code === '42703' || fallback1.error.message?.includes('does not exist'))) {
      // Try with minimal columns
      const fallback2 = await supabase
       .from('invoices')
       .select('id, amount, customer_name, status, project_id, customer_id, client_id')
       .eq('id', invoiceId)
       .eq('tenant_id', tenantId)
       .single()
      
      if (!fallback2.error && fallback2.data) {
       data = { 
        ...fallback2.data, 
        desc: null,
        description: null,
        issue_date: null,
        due_date: null
       }
       error = null
      } else {
       error = fallback2.error
      }
     } else {
      error = fallback1.error
     }
    }

    if (error) {
     // Better error message extraction
     const errorMessage = error.message || error.details || error.hint || error.code || 'Okänt fel'
     throw new Error(errorMessage)
    }
    if (!data) {
     toast.error('Faktura hittades inte')
     router.push('/invoices')
     return
    }

    setInvoice(data as Invoice)
   } catch (err: any) {
    const errorMessage = extractErrorMessage(err)
    toast.error('Kunde inte hämta faktura: ' + errorMessage)
    router.push('/invoices')
   } finally {
    setLoading(false)
   }
  }

  fetchInvoice()
 }, [invoiceId, tenantId, router])

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  if (!invoice || !tenantId) return

  setSaving(true)
  try {
   const formData = new FormData(e.currentTarget)
   const updateData: any = {
    amount: Number(formData.get('amount')) || 0,
    customer_name: formData.get('customer_name')?.toString() || null,
    desc: formData.get('desc')?.toString() || formData.get('description')?.toString() || null,
    description: formData.get('description')?.toString() || formData.get('desc')?.toString() || null,
    status: formData.get('status')?.toString() || 'draft',
    issue_date: formData.get('issue_date')?.toString() || null,
    due_date: formData.get('due_date')?.toString() || null,
   }

   const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)

   if (error) {
    const errorMessage = error.message || error.details || error.hint || error.code || 'Okänt fel'
    throw new Error(errorMessage)
   }

   toast.success('Faktura uppdaterad!')
   
   // Dispatch invoice updated event
   if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('invoiceUpdated', { 
     detail: { invoiceId, timestamp: Date.now() }
    }))
   }
   
   router.push(`/invoices/${invoiceId}`)
  } catch (err: any) {
   const errorMessage = extractErrorMessage(err)
   toast.error('Kunde inte uppdatera faktura: ' + errorMessage)
  } finally {
   setSaving(false)
  }
 }

 if (adminLoading) {
  return (
   <div className="min-h-screen bg-white flex">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-gray-500">Kontrollerar behörighet...</div>
    </main>
   </div>
  )
 }

 if (!isAdmin) {
  return (
   <div className="min-h-screen bg-white flex">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-red-500">Endast admin kan redigera fakturor</div>
    </main>
   </div>
  )
 }

 if (loading) {
  return (
   <div className="min-h-screen bg-white flex">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-gray-500">Laddar...</div>
    </main>
   </div>
  )
 }

 if (!invoice) {
  return (
   <div className="min-h-screen bg-white flex">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-red-500">Faktura hittades inte</div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-white flex">
   <Sidebar />
   <main className="flex-1 lg:ml-0 overflow-x-hidden">
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
     <div className="mb-8">
      <h1 className="text-4xl font-semibold text-gray-900 mb-2">Redigera faktura</h1>
      <p className="text-gray-500">Uppdatera fakturainformation</p>
     </div>

     <form onSubmit={handleSubmit} className="bg-white rounded-[8px] shadow-md border border-gray-100 p-8">
      <div className="space-y-6">
       <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
         Belopp (SEK) *
        </label>
        <input
         type="number"
         name="amount"
         defaultValue={invoice.amount || 0}
         step="0.01"
         required
         aria-label="Belopp i SEK"
         aria-required="true"
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
         Kundnamn
        </label>
        <input
         type="text"
         name="customer_name"
         defaultValue={invoice.customer_name || ''}
         aria-label="Kundnamn"
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
         Beskrivning
        </label>
        <textarea
         name="description"
         defaultValue={invoice.description || invoice.desc || ''}
         rows={4}
         aria-label="Beskrivning"
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <input type="hidden" name="desc" value={invoice.desc || invoice.description || ''} />
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
         Status
        </label>
        <select
         name="status"
         defaultValue={invoice.status || 'draft'}
         aria-label="Status"
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
         <option value="draft">Utkast</option>
         <option value="sent">Skickad</option>
         <option value="paid">Betalad</option>
         <option value="archived">Arkiverad</option>
        </select>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">
          Utfärdad
         </label>
         <input
          type="date"
          name="issue_date"
          defaultValue={invoice.issue_date || ''}
          aria-label="Utfärdad datum"
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
         />
        </div>

        <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">
          Förfallodatum
         </label>
         <input
          type="date"
          name="due_date"
          defaultValue={invoice.due_date || ''}
          aria-label="Förfallodatum"
          className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
         />
        </div>
       </div>
      </div>

      <div className="flex gap-4 mt-8">
       <button
        type="submit"
        disabled={saving}
        aria-label={saving ? 'Sparar ändringar' : 'Spara ändringar'}
        aria-busy={saving}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50"
       >
        {saving ? 'Sparar...' : 'Spara ändringar'}
       </button>
       <button
        type="button"
        onClick={() => router.back()}
        aria-label="Avbryt och gå tillbaka"
        className="px-6 py-3 rounded-[8px] border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
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

