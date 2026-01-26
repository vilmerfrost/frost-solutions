'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { apiFetch } from '@/lib/http/fetcher'

interface EmployeeOnSite {
 id: string
 employee: {
  id: string
  name: string
  email?: string
 }
 project: string
 location: {
  lat: number
  lng: number
 }
 checkedInAt: string
 date: string
 workSite: {
  id: string
  name: string
  lat: number
  lng: number
 } | null
}

interface WorkSite {
 id: string
 name: string
 lat: number
 lng: number
 radius: number
}

interface LiveMapClientProps {
  tenantId: string
}

export default function LiveMapClient({ tenantId }: LiveMapClientProps) {
 const [employees, setEmployees] = useState<EmployeeOnSite[]>([])
 const [workSites, setWorkSites] = useState<WorkSite[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
  if (!tenantId) return
  fetchLiveData()
  const interval = setInterval(fetchLiveData, 30000) // Update every 30 seconds
  return () => clearInterval(interval)
 }, [tenantId])

 async function fetchLiveData() {
  try {
   const data = await apiFetch<{ employees?: EmployeeOnSite[]; workSites?: WorkSite[] }>('/api/admin/live-map')
   setEmployees(data.employees || [])
   setWorkSites(data.workSites || [])
   setError(null)
  } catch (err: any) {
   console.error('Error fetching live map data:', err)
   setError(err.message)
  } finally {
   setLoading(false)
  }
 }

 if (loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 p-10">
     <div className="text-center py-20 text-gray-500">Laddar karta...</div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-2">
       Live Karta
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
       Se alla incheckade anställda på karta i realtid
      </p>
     </div>

     {error && (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-[8px] p-4 mb-6 border border-red-200 dark:border-red-800">
       <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
     )}

     {/* Simple Map View (without external libraries for now) */}
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6 border border-gray-100 dark:border-gray-700 mb-6">
      <div className="mb-4">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Aktiva anställda: {employees.length}
       </h2>
       
       {employees.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
         Ingen aktiv just nu
        </div>
       ) : (
        <div className="space-y-4">
         {employees.map((emp) => (
          <div
           key={emp.id}
           className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
          >
           <div className="flex justify-between items-start">
            <div>
             <h3 className="font-bold text-gray-900 dark:text-white">
              {emp.employee.name}
             </h3>
             <p className="text-sm text-gray-600 dark:text-gray-400">
              Projekt: {emp.project}
             </p>
             <p className="text-sm text-gray-600 dark:text-gray-400">
              Incheckad: {emp.checkedInAt}
             </p>
             {emp.workSite && (
              <p className="text-sm text-green-600 dark:text-green-400">
               På plats: {emp.workSite.name}
              </p>
             )}
            </div>
            <div className="text-right text-sm text-gray-500">
             <p>{emp.location.lat.toFixed(6)},</p>
             <p>{emp.location.lng.toFixed(6)}</p>
             <a
              href={`https://www.google.com/maps?q=${emp.location.lat},${emp.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline mt-2 block"
             >
              Öppna i Google Maps
             </a>
            </div>
           </div>
          </div>
         ))}
        </div>
       )}
      </div>

      {workSites.length > 0 && (
       <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
         Arbetsplatser: {workSites.length}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {workSites.map((site) => {
          const employeesAtSite = employees.filter(
           (emp) => emp.workSite?.id === site.id
          )
          return (
           <div
            key={site.id}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
           >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
             {site.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
             Radie: {site.radius}m
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
             {employeesAtSite.length} anställda just nu
            </p>
            <a
             href={`https://www.google.com/maps?q=${site.lat},${site.lng}`}
             target="_blank"
             rel="noopener noreferrer"
             className="text-blue-500 hover:underline text-sm mt-2 block"
            >
             Visa på karta
            </a>
           </div>
          )
         })}
        </div>
       </div>
      )}

      {/* Note about full map integration */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
       <p className="text-sm text-yellow-800 dark:text-yellow-200">
        <strong>Tips:</strong> För en fullständig interaktiv karta, kan vi integrera Google Maps eller Leaflet.
        För nu visar vi en lista med länkar till Google Maps för varje position.
       </p>
      </div>
     </div>
    </div>
   </main>
  </div>
 )
}
