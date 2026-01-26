'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { RotCalculator } from '@/components/rot/RotCalculator'
import { ROTAISummary } from '@/components/rot/ROTAISummary'
import { apiFetch } from '@/lib/http/fetcher'
import { BASE_PATH } from '@/utils/url'

interface RotApplication {
 id: string
 project_id?: string | null
 client_id?: string | null
 customer_person_number: string
 property_designation: string
 work_type: string
 work_cost_sek: number
 material_cost_sek: number
 total_cost_sek: number
 case_number?: string | null
 reference_id?: string | null
 status: string
 submission_date?: string | null
 last_status_check?: string | null
 projects?: { name: string } | null
 clients?: { name: string } | null
}

interface StatusHistory {
 id: string
 status: string
 status_message?: string | null
 rejection_reason?: string | null
 decision_date?: string | null
 created_at: string
}

const statusLabels: Record<string, string> = {
 draft: 'Utkast',
 submitted: 'Inskickad',
 under_review: 'Under handläggning',
 approved: 'Godkänd',
 rejected: 'Avslagen',
 appealed: 'Överklagad',
 closed: 'Avslutad',
}

const statusColors: Record<string, string> = {
 draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
 submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
 under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
 approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
 rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
 appealed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
 closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export default function RotApplicationDetailPage() {
 const router = useRouter()
 const params = useParams()
 const { tenantId } = useTenant()
 const applicationId = params?.id as string

 const [application, setApplication] = useState<RotApplication | null>(null)
 const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
 const [loading, setLoading] = useState(true)
 const [submitting, setSubmitting] = useState(false)
 const [checkingStatus, setCheckingStatus] = useState(false)
 const [showBankIdModal, setShowBankIdModal] = useState(false)

 // Move loadData outside useEffect so it can be called from other functions
 async function loadData() {
  if (!tenantId || !applicationId) return

  setLoading(true)
  try {
   // Load application
   const { data: appData, error: appError } = await supabase
    .from('rot_applications')
    .select(`
     *,
     projects(name),
     clients(name)
    `)
    .eq('id', applicationId)
    .eq('tenant_id', tenantId)
    .single()

   if (appError || !appData) {
    toast.error('Kunde inte ladda ROT-ansökan')
    setLoading(false)
    return
   }

   setApplication(appData as RotApplication)

   // Load status history
   const { data: historyData } = await supabase
    .from('rot_status_history')
    .select('*')
    .eq('rot_application_id', applicationId)
    .order('created_at', { ascending: false })

   setStatusHistory((historyData || []) as StatusHistory[])
  } catch (err: any) {
   console.error('Error loading ROT application:', err)
   toast.error('Kunde inte ladda ROT-ansökan')
  } finally {
   setLoading(false)
  }
 }

 useEffect(() => {
  if (!tenantId || !applicationId) {
   setLoading(false)
   return
  }

  loadData()
 }, [tenantId, applicationId])

 async function handleSubmitToSkatteverket() {
  if (!application || !tenantId) {
   toast.error('Saknade data')
   return
  }

  // Show BankID modal first
  setShowBankIdModal(true)
  
  // Then submit in background
  setSubmitting(true)

  try {
   await apiFetch(`/api/rot/${applicationId}/submit`, {
    method: 'POST',
   })

   toast.success('Ansökan skickad till Skatteverket!')
   await loadData() // Reload to get updated status
  } catch (err: any) {
   console.error('Error submitting ROT application:', err)
   toast.error('Kunde inte skicka ansökan: ' + (err.message || 'Okänt fel'))
  } finally {
   setSubmitting(false)
   setShowBankIdModal(false)
  }
 }

 async function handleCheckStatus() {
  if (!application || !applicationId || !tenantId) {
   toast.error('Saknade data')
   return
  }

  setCheckingStatus(true)

  try {
   await apiFetch(`/api/rot/${applicationId}/status`, {
    method: 'POST',
   })

   toast.success('Status uppdaterad!')
   await loadData()
  } catch (err: any) {
   console.error('Error checking status:', err)
   toast.error('Kunde inte kontrollera status: ' + (err.message || 'Okänt fel'))
  } finally {
   setCheckingStatus(false)
  }
 }

 async function handleCreateInvoice() {
  if (!application || !tenantId) {
   toast.error('Saknade data')
   return
  }
  
  if (application.status !== 'approved') {
   toast.error('Ansökan måste vara godkänd för att skapa faktura')
   return
  }

  // Navigate to invoice creation with ROT application data
  const rotDeduction = application.work_cost_sek * 0.3 // 30% of work cost
  const invoiceAmount = application.total_cost_sek - rotDeduction

  router.push(`/invoices/new?rotApplicationId=${applicationId}&amount=${invoiceAmount}&clientId=${application.client_id}`)
 }

 function formatPersonNumber(pnr: string): string {
  const clean = pnr.replace(/[-\s]/g, '')
  if (clean.length === 12) {
   return `${clean.substring(0, 8)}-${clean.substring(8)}`
  }
  return pnr
 }

 function sek(n: number) {
  return Number(n ?? 0).toLocaleString('sv-SE', {
   style: 'currency',
   currency: 'SEK',
  })
 }

 if (loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden flex items-center justify-center">
     <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
    </main>
   </div>
  )
 }

 if (!application) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden flex items-center justify-center">
     <div className="text-red-500 dark:text-red-400">ROT-ansökan hittades inte</div>
    </main>
   </div>
  )
 }

 const rotDeduction = application.work_cost_sek * 0.3 // 30% ROT deduction
 const maxDeduction = 75000 // Max per year
 const actualDeduction = Math.min(rotDeduction, maxDeduction)

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
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

     {/* Header */}
     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
        ROT-ansökan
       </h1>
       <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
        {application.projects?.name || application.clients?.name || 'Okänt projekt/kund'}
       </p>
      </div>
      <button
       onClick={() => router.back()}
       className="w-full sm:w-auto px-6 py-3 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
       Tillbaka
      </button>
     </div>

     {/* Status Card */}
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-4">
       <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Status</h2>
        <span
         className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
          statusColors[application.status] || statusColors.draft
         }`}
        >
         {statusLabels[application.status] || application.status}
        </span>
       </div>
       {application.case_number && (
        <div className="text-right">
         <p className="text-sm text-gray-500 dark:text-gray-400">Ärendenummer</p>
         <p className="font-mono font-bold text-gray-900 dark:text-white">{application.case_number}</p>
        </div>
       )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-4">
       {application.status === 'draft' && (
        <button
         onClick={handleSubmitToSkatteverket}
         disabled={submitting}
         className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
         {submitting ? 'Skickar...' : 'Skicka till Skatteverket'}
        </button>
       )}
       
       {['submitted', 'under_review'].includes(application.status) && (
        <button
         onClick={handleCheckStatus}
         disabled={checkingStatus}
         className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
         {checkingStatus ? 'Kontrollerar...' : 'Uppdatera status'}
        </button>
       )}

       {application.status === 'approved' && (
        <button
         onClick={handleCreateInvoice}
         className="bg-success-500 hover:bg-success-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
        >
         Skicka faktura med ROT-avdrag
        </button>
       )}

       {application.status === 'rejected' && (
        <div className="flex flex-wrap gap-3">
         <button
          onClick={() => router.push(`/rot/${applicationId}/appeal`)}
          className="bg-error-500 hover:bg-error-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
         >
          Överklaga
         </button>
         <button
          onClick={handleCreateInvoice}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
         >
          Skicka faktura utan ROT-avdrag
         </button>
        </div>
       )}

       {application.status === 'closed' && (
        <div className="flex gap-3">
         <button
          onClick={async () => {
           if (confirm('Exportera ROT-data för GDPR?')) {
            const response = await fetch(`${BASE_PATH}/api/rot/export/${tenantId}`)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `rot-export-${tenantId}-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('Data exporterad!')
           }
          }}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
         >
          📥 Exportera data (GDPR)
         </button>
        </div>
       )}
      </div>
     </div>

     {/* Application Details */}
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ansökningsdetaljer</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Kund</p>
        <p className="font-semibold text-gray-900 dark:text-white">
         {application.clients?.name || 'Okänd kund'}
        </p>
       </div>
       <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Projekt</p>
        <p className="font-semibold text-gray-900 dark:text-white">
         {application.projects?.name || 'Inget projekt'}
        </p>
       </div>
       <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Personnummer</p>
        <p className="font-semibold text-gray-900 dark:text-white">
         {formatPersonNumber(application.customer_person_number)}
        </p>
       </div>
       <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fastighetsbeteckning</p>
        <p className="font-semibold text-gray-900 dark:text-white">
         {application.property_designation}
        </p>
       </div>
       <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Arbetstyp</p>
        <p className="font-semibold text-gray-900 dark:text-white capitalize">
         {application.work_type}
        </p>
       </div>
       {application.submission_date && (
        <div>
         <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Inskickad</p>
         <p className="font-semibold text-gray-900 dark:text-white">
          {new Date(application.submission_date).toLocaleDateString('sv-SE', {
           year: 'numeric',
           month: 'long',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit',
          })}
         </p>
        </div>
       )}
      </div>

      {/* Costs */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
       <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Kostnader</h3>
       <div className="space-y-2">
        <div className="flex justify-between">
         <span className="text-gray-600 dark:text-gray-400">Arbetskostnad</span>
         <span className="font-semibold text-gray-900 dark:text-white">{sek(application.work_cost_sek)}</span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-600 dark:text-gray-400">Materialkostnad</span>
         <span className="font-semibold text-gray-900 dark:text-white">{sek(application.material_cost_sek)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
         <span className="font-semibold text-gray-900 dark:text-white">Totalkostnad</span>
         <span className="font-bold text-lg text-gray-900 dark:text-white">{sek(application.total_cost_sek)}</span>
        </div>
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-[8px] border border-green-200 dark:border-green-800">
         <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-green-800 dark:text-green-300">ROT-avdrag (30%)</span>
          <span className="font-bold text-lg text-green-900 dark:text-green-300">{sek(actualDeduction)}</span>
         </div>
         <p className="text-xs text-green-700 dark:text-green-400">
          Max 75 000 kr per år. Efter avdrag: {sek(application.total_cost_sek - actualDeduction)}
         </p>
        </div>
       </div>
      </div>

      {/* ROT Calculator Widget */}
      <div className="mt-6">
       <RotCalculator
        invoiceDateISO={application.submission_date || new Date().toISOString()}
        laborCost={application.work_cost_sek}
        materialCost={application.material_cost_sek}
       />
      </div>

      {/* AI Summary */}
      <div className="mt-8">
       <ROTAISummary
        rotData={{
         customerName: application.clients?.name || 'Kund',
         projectDescription: `${application.work_type} på ${application.property_designation}`,
         workPeriod: application.submission_date
          ? `${new Date(application.submission_date).toLocaleDateString('sv-SE')} till ${new Date().toLocaleDateString('sv-SE')}`
          : 'Pågående',
         totalAmount: application.total_cost_sek,
         vatAmount: Math.round(application.total_cost_sek * 0.25),
         rotAmount: application.work_cost_sek,
         rutAmount: undefined,
        }}
        onSummaryGenerated={(summary) => {
         // Optionally save to database
         console.log('AI Summary generated:', summary);
         toast.success('AI-sammanfattning genererad!');
        }}
       />
      </div>
     </div>

     {/* Status History */}
     {statusHistory.length > 0 && (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Statushistorik</h2>
       <div className="space-y-3">
        {statusHistory.map((entry) => (
         <div
          key={entry.id}
          className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
         >
          <div className="flex-1">
           <div className="flex items-center gap-2 mb-1">
            <span
             className={`px-2 py-1 rounded text-xs font-semibold ${
              statusColors[entry.status] || statusColors.draft
             }`}
            >
             {statusLabels[entry.status] || entry.status}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
             {new Date(entry.created_at).toLocaleDateString('sv-SE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
             })}
            </span>
           </div>
           {entry.status_message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{entry.status_message}</p>
           )}
           {entry.rejection_reason && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
             <strong>Orsak:</strong> {entry.rejection_reason}
            </p>
           )}
          </div>
         </div>
        ))}
       </div>
      </div>
     )}
    </div>
   </main>

   {/* BankID Modal */}
   {showBankIdModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-xl max-w-md w-full p-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
       BankID-autentisering krävs
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
       För att skicka ROT-ansökan till Skatteverket behöver du logga in med BankID på Skatteverkets e-tjänst.
      </p>
      <div className="space-y-3">
       <a
        href="https://skatteverket.se/rotochrut"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold text-center shadow-md hover:shadow-xl transition-all"
       >
        Öppna Skatteverkets ROT/RUT-sida
       </a>
       <button
        onClick={() => setShowBankIdModal(false)}
        className="w-full px-6 py-3 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
       >
        Stäng
       </button>
      </div>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
       Ansökan kommer att skickas automatiskt när du har autentiserat dig med BankID.
      </p>
     </div>
    </div>
   )}
  </div>
 )
}

