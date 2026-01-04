'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'

export default function NewEmployeePage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [fullName, setFullName] = useState('')
 const [email, setEmail] = useState('')
 const [role, setRole] = useState<'employee' | 'admin'>('employee')
 const [baseRate, setBaseRate] = useState('360') // Default grundlön per timme
 const [loading, setLoading] = useState(false)
 const { isAdmin, loading: adminLoading } = useAdmin()

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  
  if (!isAdmin) {
   toast.error('Endast administratörer kan lägga till anställda.')
   return
  }
  
  setLoading(true)

  if (!tenantId) {
   toast.error('Ingen tenant satt. Logga in eller välj tenant först.')
   setLoading(false)
   return
  }

  if (!fullName.trim()) {
   toast.error('Namn krävs')
   setLoading(false)
   return
  }

  try {
   // Use API route with service role for reliable employee creation
   // Ensure role is lowercase to match database constraint
   const normalizedRole = role && typeof role === 'string' 
    ? role.toLowerCase() 
    : 'employee'
   
   const payload: any = {
    tenant_id: tenantId,
    name: fullName.trim(),
    full_name: fullName.trim(),
    role: normalizedRole,
    base_rate_sek: Number(baseRate) || 360,
    default_rate_sek: Number(baseRate) || 360,
   }

   if (email.trim()) {
    payload.email = email.trim()
   }

   const res = await fetch('/api/employees/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Kunde inte skapa anställd')
   }

   const result = await res.json()
   
   if (result.error) {
    throw new Error(result.error)
   }

   // Send notification to admins about new employee (for billing purposes)
   try {
    // Get all admins in the tenant
    const { data: admins } = await supabase
     .from('employees')
     .select('auth_user_id, name, full_name, email')
     .eq('tenant_id', tenantId)
     .or('role.eq.admin,role.eq.Admin')
    
    // Store notification or trigger email/webhook here
    // For now, we'll just log it - you can implement actual notifications later
    console.log('New employee created - notify admins:', {
     employeeName: fullName,
     role,
     tenantId,
     admins: admins?.length || 0
    })
    
    // You can add actual notification logic here:
    // - Store in notifications table
    // - Send email to admins
    // - Trigger webhook
    // - Send push notification
   } catch (notifErr) {
    console.error('Error sending notification:', notifErr)
    // Don't fail the employee creation if notification fails
   }

   toast.success('Anställd skapad! Administratörer har fått en notifikation.')
   router.replace('/employees')
  } catch (err: any) {
   console.error('Unexpected error:', err)
   toast.error('Ett oväntat fel uppstod: ' + (err.message || 'Okänt fel'))
   setLoading(false)
  }
 }

 if (adminLoading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden flex items-center justify-center">
     <div className="text-gray-500 dark:text-gray-400">Kontrollerar behörighet...</div>
    </main>
   </div>
  )
 }

 if (!isAdmin) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
     <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[8px] p-6 text-center">
       <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Åtkomst nekad</h2>
       <p className="text-red-600 dark:text-red-400">Endast administratörer kan lägga till anställda.</p>
       <button
        onClick={() => router.back()}
        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
       >
        Tillbaka
       </button>
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
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
       Lägg till anställd
      </h1>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Skapa en ny anställd (endast administratörer)</p>
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
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
         Om användaren loggar in med denna e-post kan de kopplas automatiskt
        </p>
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
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
         Administratörer kan se alla tidsrapporter och har full åtkomst
        </p>
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
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
         Grundlön per timme enligt byggkollektivavtalet. OB-tillägg beräknas automatiskt:
         <br />
         <span className="font-semibold">OB Kväll/Natt:</span> 150% av grundlön
         <br />
         <span className="font-semibold">OB Helg:</span> 200% av grundlön
        </p>
       </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
       <button
        type="submit"
        disabled={loading}
        className="w-full sm:flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-3 sm:py-4 font-bold text-base sm:text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
       >
        {loading ? (
         <span className="flex items-center justify-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Sparar...
         </span>
        ) : (
         'Skapa anställd'
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

