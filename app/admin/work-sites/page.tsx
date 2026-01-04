'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'

interface WorkSite {
 id: string
 name: string
 address?: string
 latitude: number
 longitude: number
 radius_meters: number
 auto_checkin_enabled: boolean
 auto_checkin_distance: number
 created_at?: string
}

export default function WorkSitesPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [workSites, setWorkSites] = useState<WorkSite[]>([])
 const [loading, setLoading] = useState(true)
 const [isAdmin, setIsAdmin] = useState(false)
 const [showForm, setShowForm] = useState(false)
 const [editingSite, setEditingSite] = useState<WorkSite | null>(null)
 
 // Form state
 const [name, setName] = useState('')
 const [address, setAddress] = useState('')
 const [latitude, setLatitude] = useState('')
 const [longitude, setLongitude] = useState('')
 const [radiusMeters, setRadiusMeters] = useState(100)
 const [autoCheckinEnabled, setAutoCheckinEnabled] = useState(false)
 const [autoCheckinDistance, setAutoCheckinDistance] = useState(500)

 useEffect(() => {
  async function checkAdmin() {
   if (!tenantId) return

   try {
    // Use API route that handles RLS and service role fallback
    const res = await fetch('/api/admin/check')
    if (res.ok) {
     const data = await res.json()
     setIsAdmin(data.isAdmin || false)
     if (!data.isAdmin && data.error) {
      console.warn('Admin check failed:', data.error, data.suggestion)
     }
    } else {
     console.error('Admin check API error:', await res.text())
    }
   } catch (err) {
    console.error('Error checking admin:', err)
    // Fallback: Try direct query
    try {
     const { data: { user } } = await supabase.auth.getUser()
     if (user) {
      const { data: empData } = await supabase
       .from('employees')
       .select('role')
       .eq('auth_user_id', user.id)
       .eq('tenant_id', tenantId)
       .maybeSingle()
      
      const emp = empData as any
      const isAdminCheck = emp?.role === 'admin' || 
                emp?.role === 'Admin' || 
                emp?.role?.toLowerCase() === 'admin'
      setIsAdmin(isAdminCheck || false)
     }
    } catch (fallbackErr) {
     console.error('Fallback admin check also failed:', fallbackErr)
    }
   }
  }

  checkAdmin()
 }, [tenantId])

 useEffect(() => {
  if (!tenantId || !isAdmin) return
  fetchWorkSites()
 }, [tenantId, isAdmin])

 async function fetchWorkSites() {
  if (!tenantId) return

  setLoading(true)
  try {
   // Try API route first (uses service role) - add cache busting
   const res = await fetch(`/api/work-sites?_t=${Date.now()}`, {
    cache: 'no-store',
    headers: {
     'Cache-Control': 'no-cache',
    },
   })
   if (res.ok) {
    const data = await res.json()
    console.log('✅ Fetched work sites:', data.workSites?.length || 0)
    setWorkSites(data.workSites || [])
    setLoading(false)
    return
   }

   // Fallback: Direct query
   const { data, error } = await supabase
    .from('work_sites')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

   if (error) {
    if (error.message.includes('does not exist')) {
     toast.warning('Work sites tabell finns inte ännu. Kör SUPABASE_CREATE_WORK_SITES.sql först.')
    } else {
     toast.error('Kunde inte hämta arbetsplatser: ' + error.message)
    }
   } else {
    console.log('✅ Fetched work sites (fallback):', data?.length || 0)
    setWorkSites(data || [])
   }
  } catch (err: any) {
   console.error('Error fetching work sites:', err)
   toast.error('Fel vid hämtning av arbetsplatser')
  } finally {
   setLoading(false)
  }
 }

 async function getCurrentLocation() {
  if (!navigator.geolocation) {
   toast.error('GPS stöds inte av din webbläsare')
   return
  }

  navigator.geolocation.getCurrentPosition(
   (position) => {
    setLatitude(position.coords.latitude.toFixed(8))
    setLongitude(position.coords.longitude.toFixed(8))
    toast.success('GPS-position hämtad!')
   },
   (error) => {
    toast.error('Kunde inte hämta GPS-position: ' + error.message)
   },
   { enableHighAccuracy: true, timeout: 10000 }
  )
 }

 function resetForm() {
  setName('')
  setAddress('')
  setLatitude('')
  setLongitude('')
  setRadiusMeters(100)
  setAutoCheckinEnabled(false)
  setAutoCheckinDistance(500)
  setEditingSite(null)
  setShowForm(false)
 }

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()

  if (!tenantId) {
   toast.error('Ingen tenant vald')
   return
  }

  if (!name.trim() || !latitude || !longitude) {
   toast.error('Namn och GPS-koordinater krävs')
   return
  }

  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)

  if (isNaN(lat) || isNaN(lng)) {
   toast.error('Ogiltiga GPS-koordinater')
   return
  }

  try {
   const payload: any = {
    tenant_id: tenantId,
    name: name.trim(),
    latitude: lat,
    longitude: lng,
    radius_meters: radiusMeters,
    auto_checkin_enabled: autoCheckinEnabled,
    auto_checkin_distance: autoCheckinDistance,
   }

   if (address.trim()) {
    payload.address = address.trim()
   }

   // Use API route (with service role)
   const url = editingSite 
    ? `/api/work-sites/${editingSite.id}`
    : '/api/work-sites'
   
   const method = editingSite ? 'PUT' : 'POST'

   const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Kunde inte spara')
   }

   toast.success(editingSite ? 'Arbetsplats uppdaterad!' : 'Arbetsplats skapad!')
   resetForm()
   
   // Small delay to ensure database commit, then refresh
   setTimeout(() => {
    fetchWorkSites()
   }, 300)
  } catch (err: any) {
   console.error('Error saving work site:', err)
   toast.error('Kunde inte spara: ' + err.message)
  }
 }

 function startEdit(site: WorkSite) {
  setEditingSite(site)
  setName(site.name)
  setAddress(site.address || '')
  setLatitude(site.latitude.toString())
  setLongitude(site.longitude.toString())
  setRadiusMeters(site.radius_meters)
  setAutoCheckinEnabled(site.auto_checkin_enabled)
  setAutoCheckinDistance(site.auto_checkin_distance)
  setShowForm(true)
 }

 async function handleDelete(id: string) {
  if (!confirm('Är du säker på att du vill ta bort denna arbetsplats?')) return

  try {
   // Use API route (with service role)
   const res = await fetch(`/api/work-sites/${id}`, {
    method: 'DELETE',
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Kunde inte ta bort')
   }

   toast.success('Arbetsplats borttagen!')
   // Small delay to ensure database commit, then refresh
   setTimeout(() => {
    fetchWorkSites()
   }, 300)
  } catch (err: any) {
   console.error('Error deleting work site:', err)
   toast.error('Kunde inte ta bort: ' + err.message)
  }
 }

 if (!isAdmin) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 p-10">
     <div className="max-w-4xl mx-auto">
      <div className="bg-red-50 dark:bg-red-900/20 rounded-[8px] p-6 border border-red-200 dark:border-red-800">
       <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">
        Åtkomst nekad
       </h2>
       <p className="text-red-700 dark:text-red-300">
        Endast administratörer kan hantera arbetsplatser.
       </p>
      </div>
     </div>
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
       🗺️ Arbetsplatser
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
       Hantera arbetsplatser för GPS-tracking och auto-checkin
      </p>
     </div>

     {/* Add/Edit Form */}
     {showForm && (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {editingSite ? 'Redigera arbetsplats' : 'Ny arbetsplats'}
       </h2>
       
       <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Namn *
          </label>
          <input
           type="text"
           value={name}
           onChange={(e) => setName(e.target.value)}
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
           required
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
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
         </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Latitud *
          </label>
          <input
           type="number"
           step="0.00000001"
           value={latitude}
           onChange={(e) => setLatitude(e.target.value)}
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
           required
          />
         </div>
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Longitud *
          </label>
          <input
           type="number"
           step="0.00000001"
           value={longitude}
           onChange={(e) => setLongitude(e.target.value)}
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
           required
          />
         </div>
         <div className="flex items-end">
          <button
           type="button"
           onClick={getCurrentLocation}
           className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-[8px] font-semibold transition-colors"
          >
           📍 Använd min position
          </button>
         </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Radie (meter) *
          </label>
          <input
           type="number"
           value={radiusMeters}
           onChange={(e) => setRadiusMeters(parseInt(e.target.value) || 100)}
           className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
           required
           min="10"
          />
          <p className="text-xs text-gray-500 mt-1">Avstånd för att räknas som "på plats"</p>
         </div>
         <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
           Auto-checkin aktiverad
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
           <input
            type="checkbox"
            checked={autoCheckinEnabled}
            onChange={(e) => setAutoCheckinEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
           />
           <span className="text-sm text-gray-700 dark:text-gray-300">
            {autoCheckinEnabled ? 'Ja' : 'Nej'}
           </span>
          </label>
         </div>
         {autoCheckinEnabled && (
          <div>
           <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Auto-checkin avstånd (meter) *
           </label>
           <input
            type="number"
            value={autoCheckinDistance}
            onChange={(e) => setAutoCheckinDistance(parseInt(e.target.value) || 500)}
            className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
            min="50"
           />
           <p className="text-xs text-gray-500 mt-1">Avstånd för auto-checkin (default 500m)</p>
          </div>
         )}
        </div>

        <div className="flex gap-4">
         <button
          type="button"
          onClick={resetForm}
          className="flex-1 px-6 py-3 rounded-[8px] border-2 border-gray-300 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
         >
          Avbryt
         </button>
         <button
          type="submit"
          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
         >
          {editingSite ? 'Uppdatera' : 'Skapa'}
         </button>
        </div>
       </form>
      </div>
     )}

     {/* List Work Sites */}
     {!showForm && (
      <button
       onClick={() => setShowForm(true)}
       className="mb-6 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
      >
       + Lägg till arbetsplats
      </button>
     )}

     {loading ? (
      <div className="text-center py-10 text-gray-500">Laddar...</div>
     ) : workSites.length === 0 ? (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-[8px] p-8 text-center">
       <p className="text-gray-600 dark:text-gray-400 mb-4">
        Inga arbetsplatser ännu
       </p>
       <button
        onClick={() => setShowForm(true)}
        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold"
       >
        Skapa första arbetsplatsen
       </button>
      </div>
     ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       {workSites.map((site) => (
        <div
         key={site.id}
         className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6 border border-gray-100 dark:border-gray-700"
        >
         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {site.name}
         </h3>
         {site.address && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
           📍 {site.address}
          </p>
         )}
         <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <p>Koordinater: {Number(site.latitude).toFixed(6)}, {Number(site.longitude).toFixed(6)}</p>
          <p>Radie: {site.radius_meters}m</p>
          <p>
           Auto-checkin: {site.auto_checkin_enabled ? '✅ Ja' : '❌ Nej'}
           {site.auto_checkin_enabled && ` (${site.auto_checkin_distance}m)`}
          </p>
         </div>
         <div className="flex gap-2">
          <button
           onClick={() => startEdit(site)}
           className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
           Redigera
          </button>
          <button
           onClick={() => handleDelete(site.id)}
           className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
           Ta bort
          </button>
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

