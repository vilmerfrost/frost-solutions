'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import supabase from '@/utils/supabase/supabaseClient'

interface Employee {
 id: string
 name: string
 full_name?: string
 role?: string
 email?: string
 base_rate_sek?: number
 default_rate_sek?: number
}

export default function EditEmployeePage() {
 const router = useRouter()
 const params = useParams()
 const { tenantId } = useTenant()
 const { isAdmin, loading: adminLoading } = useAdmin()
 
 const employeeId = params?.id as string | undefined
 
 const [employee, setEmployee] = useState<Employee | null>(null)
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 
 const [fullName, setFullName] = useState('')
 const [email, setEmail] = useState('')
 const [role, setRole] = useState<'employee' | 'admin'>('employee')
 const [baseRate, setBaseRate] = useState('360')

 useEffect(() => {
  if (!isAdmin && !adminLoading) {
   toast.error('Endast administratörer kan redigera anställda.')
   router.push('/employees')
   return
  }

  if (!employeeId || !tenantId) {
   setLoading(false)
   return
  }

  async function fetchEmployee() {
   try {
    // Try with full columns first
    const result = await supabase
     .from('employees')
     .select('id, name, full_name, role, email, base_rate_sek, default_rate_sek')
     .eq('id', employeeId as string)
     .eq('tenant_id', tenantId as string)
     .single()
    
    let data: any = result.data
    let error: any = result.error

    // If default_rate_sek doesn't exist, retry without it
    if (error && (error.code === '42703' || error.message?.includes('default_rate_sek'))) {
     const retry = await supabase
      .from('employees')
      .select('id, name, full_name, role, email, base_rate_sek')
      .eq('id', employeeId as string)
      .eq('tenant_id', tenantId as string)
      .single()
     
     data = (retry as any).data
     error = (retry as any).error
    }

    // If base_rate_sek also doesn't exist, try without both
    if (error && (error.code === '42703' || error.message?.includes('base_rate_sek'))) {
     const retryMinimal = await supabase
      .from('employees')
      .select('id, name, full_name, role, email')
      .eq('id', employeeId as string)
      .eq('tenant_id', tenantId as string)
      .single()
     
     data = (retryMinimal as any).data
     error = (retryMinimal as any).error
    }

    if (error) {
     console.error('Error fetching employee:', error)
     toast.error('Kunde inte hämta anställd: ' + (error.message || 'Okänt fel'))
     router.push('/employees')
     return
    }

    if (data) {
     setEmployee(data)
     setFullName(data.full_name || data.name || '')
     setEmail(data.email || '')
     setRole((data.role?.toLowerCase() as 'employee' | 'admin') || 'employee')
     // Use base_rate_sek, fallback to default_rate_sek, fallback to 360
     setBaseRate(String(data.base_rate_sek || (data as any).default_rate_sek || 360))
    }
   } catch (err: any) {
    console.error('Unexpected error:', err)
    toast.error('Ett oväntat fel uppstod: ' + (err.message || 'Okänt fel'))
   } finally {
    setLoading(false)
   }
  }

  fetchEmployee()
 }, [employeeId, tenantId, isAdmin, adminLoading, router])

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  
  if (!isAdmin) {
   toast.error('Endast administratörer kan redigera anställda.')
   return
  }

  if (!employeeId || !tenantId) {
   toast.error('Saknar anställd-ID eller tenant-ID')
   return
  }

  if (!fullName.trim()) {
   toast.error('Namn krävs')
   return
  }

  setSaving(true)

  try {
   // Normalize role to lowercase
   const normalizedRole = role && typeof role === 'string' 
    ? role.toLowerCase() 
    : 'employee'

   const payload: any = {
    name: fullName.trim(),
    full_name: fullName.trim(),
    role: normalizedRole,
    base_rate_sek: Number(baseRate) || 360,
    default_rate_sek: Number(baseRate) || 360,
   }

   if (email.trim()) {
    payload.email = email.trim().toLowerCase()
   }

   const res = await fetch(`/api/employees/${employeeId}/update`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Kunde inte uppdatera anställd')
   }

   const result = await res.json()
   
   if (result.error) {
    throw new Error(result.error)
   }

   toast.success('Anställd uppdaterad!')
   router.push('/employees')
  } catch (err: any) {
   console.error('Unexpected error:', err)
   toast.error('Ett oväntat fel uppstod: ' + (err.message || 'Okänt fel'))
   setSaving(false)
  }
 }

 if (adminLoading || loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden flex items-center justify-center">
     <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
    </main>
   </div>
  )
 }

 if (!isAdmin) {
  return null // Will redirect
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
       Redigera anställd
      </h1>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
       Uppdatera information för {employee?.full_name || employee?.name || 'anställd'}
      </p>
     </div>

     <form
      className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700"
      onSubmit={handleSubmit}
     >
      <div className="space-y-6">
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Namn *
        </label>
        <input
         type="text"
         value={fullName}
         onChange={(e) => setFullName(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
         placeholder="För- och efternamn"
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
         placeholder="namn@example.com"
        />
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Roll *
        </label>
        <select
         value={role}
         onChange={(e) => setRole(e.target.value as 'employee' | 'admin')}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
         required
        >
         <option value="employee">Anställd</option>
         <option value="admin">Administratör</option>
        </select>
       </div>

       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Grundlön per timme (SEK) *
        </label>
        <input
         type="number"
         value={baseRate}
         onChange={(e) => setBaseRate(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
         placeholder="360"
         min="1"
         step="1"
         required
        />
       </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
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

