'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'

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
 status: string
 submission_date?: string | null
 projects?: { name: string } | null
 clients?: { name: string } | null
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

export default function RotApplicationsPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [applications, setApplications] = useState<RotApplication[]>([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState<string>('all')

 useEffect(() => {
  if (!tenantId) {
   setLoading(false)
   return
  }

  loadApplications()
 }, [tenantId, filter])

 async function loadApplications() {
  if (!tenantId) return

  setLoading(true)
  try {
   let query = supabase
    .from('rot_applications')
    .select(`
     *,
     projects(name),
     clients(name)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

   if (filter !== 'all') {
    query = query.eq('status', filter)
   }

   const { data, error } = await query

   if (error) {
    console.error('Error loading ROT applications:', error)
    setApplications([])
   } else {
    setApplications((data as any) || [])
   }
  } catch (err) {
   console.error('Unexpected error:', err)
  } finally {
   setLoading(false)
  }
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

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     {/* Work in Progress Notice */}
     <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-[8px] sm:rounded-[8px] p-4 sm:p-6">
      <div className="flex items-start gap-3">
       <span className="text-2xl">🚧</span>
       <div>
        <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-1">Work in Progress</h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
         ROT-avdrag funktionen är under utveckling. Vissa funktioner kan saknas eller fungera ofullständigt.
         Vi arbetar aktivt med att förbättra funktionaliteten.
        </p>
       </div>
      </div>
     </div>

     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
        ROT-ansökningar
       </h1>
       <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
        Hantera ROT-avdrag och följ upp ansökningar till Skatteverket
       </p>
      </div>
      <button
       onClick={() => router.push('/rot/new')}
       className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm sm:text-base"
      >
       + Ny ROT-ansökan
      </button>
     </div>


     {/* Filter */}
     <div className="mb-6 flex gap-2 flex-wrap">
      {(['all', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'closed'] as const).map((f) => (
       <button
        key={f}
        onClick={() => setFilter(f)}
        className={`px-4 py-2 rounded-[8px] font-semibold transition ${
         filter === f
          ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'
          : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
       >
        {f === 'all' ? 'Alla' : statusLabels[f]}
       </button>
      ))}
     </div>

     {/* List */}
     {loading ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-12 text-center text-gray-500 dark:text-gray-400">
       Laddar...
      </div>
     ) : applications.length === 0 ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
       <p className="mb-4">Inga ROT-ansökningar {filter !== 'all' ? `med status "${statusLabels[filter]}"` : ''}</p>
       <button
        onClick={() => router.push('/rot/new')}
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
       >
        + Skapa första ROT-ansökan
       </button>
      </div>
     ) : (
      <div className="space-y-4">
       {applications.map((app) => (
        <div
         key={app.id}
         onClick={() => router.push(`/rot/${app.id}`)}
         className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
        >
         <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
           <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
             {app.projects?.name || app.clients?.name || 'Okänt projekt/kund'}
            </h3>
            <span
             className={`px-3 py-1 rounded-full text-xs font-semibold ${
              statusColors[app.status] || statusColors.draft
             }`}
            >
             {statusLabels[app.status] || app.status}
            </span>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
             <span className="font-semibold">Fastighet:</span> {app.property_designation}
            </div>
            <div>
             <span className="font-semibold">Personnummer:</span> {formatPersonNumber(app.customer_person_number)}
            </div>
            <div>
             <span className="font-semibold">Arbetstyp:</span> {app.work_type}
            </div>
            <div>
             <span className="font-semibold">Totalkostnad:</span> {sek(app.total_cost_sek)}
            </div>
           </div>

           {app.case_number && (
            <div className="mt-2 text-sm">
             <span className="font-semibold text-gray-700 dark:text-gray-300">Ärendenummer:</span>{' '}
             <span className="text-gray-600 dark:text-gray-400">{app.case_number}</span>
            </div>
           )}

           {app.submission_date && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
             Inskickad: {new Date(app.submission_date).toLocaleDateString('sv-SE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
             })}
            </div>
           )}
          </div>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>
   </main>
  </div>
 )
}

