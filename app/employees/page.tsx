'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'
import { DollarSign, Edit2, Trash2 } from 'lucide-react'
import { BASE_PATH } from '@/utils/url'

interface Employee {
 id: string
 name: string
 full_name?: string
 role?: string
 email?: string
}

export default function EmployeesPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [employees, setEmployees] = useState<Employee[]>([])
 const [loading, setLoading] = useState(true)
 const { isAdmin } = useAdmin()

 useEffect(() => {
  // Wait a bit for TenantContext to hydrate before showing warning
  if (!tenantId) {
   // Only show warning after a delay to avoid false positives during hydration
   const timeout = setTimeout(() => {
    if (!tenantId) {
     console.log('⚠️ EmployeesPage: No tenantId available after hydration delay')
    }
   }, 1000)
   setLoading(false)
   return () => clearTimeout(timeout)
  }

  async function fetchEmployees() {
   try {
    console.log('🔍 EmployeesPage: Fetching employees for tenantId:', tenantId)
    
    // Admin check is done by useAdmin hook
    
    const { data, error } = await supabase
     .from('employees')
     .select('id, name, full_name, role, email')
     .eq('tenant_id', tenantId as string)
     .order('full_name', { ascending: true })

    if (error) {
     console.error('❌ EmployeesPage: Error fetching employees:', error)
     // Tyst loggning - försök med minimal select
     try {
      const fallback = await supabase
       .from('employees')
       .select('id, name, full_name')
       .eq('tenant_id', tenantId as string)
       .order('name', { ascending: true })
      
      if (!fallback.error && fallback.data) {
       console.log('✅ EmployeesPage: Found', fallback.data.length, 'employees via fallback query')
       setEmployees((fallback.data || []).map((e: any) => ({
        id: e.id,
        name: e.full_name || e.name || 'Okänd',
        role: undefined,
        email: undefined,
       })))
      } else {
       console.error('❌ EmployeesPage: Fallback query also failed:', fallback.error)
       setEmployees([])
      }
     } catch {
      setEmployees([])
     }
    } else {
     console.log('✅ EmployeesPage: Found', data?.length || 0, 'employees for tenantId:', tenantId)
     // Filter out demo employee "Anna Snickare" if exists
     const filteredData = (data || []).filter((e: any) => {
      const name = (e.full_name || e.name || '').toLowerCase()
      return !name.includes('anna snickare') && !name.includes('demo')
     })
     
     setEmployees(filteredData.map((e: any) => ({
      id: e.id,
      name: e.full_name || e.name || 'Okänd',
      role: e.role,
      email: e.email,
     })))
    }
   } catch (err) {
    console.error('Unexpected error:', err)
   } finally {
    setLoading(false)
   }
  }

  fetchEmployees()
 }, [tenantId])

 if (loading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
    </main>
   </div>
  )
 }

 // Count employees by role
 const adminCount = employees.filter(e => e.role?.toLowerCase() === 'admin').length
 const employeeCount = employees.length - adminCount

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     {/* Header */}
     <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
       <div className="flex items-center gap-4">
        <div className="p-3 bg-primary-500 rounded-lg shadow-md">
         <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
         </svg>
        </div>
        <div>
         <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Anställda</h1>
         <p className="text-gray-600 dark:text-gray-400">Hantera dina anställda</p>
        </div>
       </div>
       {isAdmin && (
        <button
         onClick={() => router.push('/employees/new')}
         className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-semibold shadow-md hover:shadow-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2"
        >
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
         Lägg till anställd
        </button>
       )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Totalt anställda</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
         </div>
         <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
         </div>
        </div>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Administratörer</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{adminCount}</p>
         </div>
         <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
         </div>
        </div>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Medarbetare</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{employeeCount}</p>
         </div>
         <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
         </div>
        </div>
       </div>
      </div>
     </div>

     {employees.length === 0 ? (
      <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
       <div className="flex justify-center mb-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
         <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
         </svg>
        </div>
       </div>
       <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Inga anställda ännu</h3>
       <p className="text-gray-600 dark:text-gray-400 mb-6">Kom igång genom att lägga till din första anställda.</p>
       {isAdmin && (
        <button
         onClick={() => router.push('/employees/new')}
         className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-semibold shadow-md hover:shadow-xl transition-all inline-flex items-center gap-2"
        >
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
         Lägg till första anställde
        </button>
       )}
      </div>
     ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
       {employees.map((emp) => (
        <div
         key={emp.id}
         className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-700"
        >
         <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow">
            {emp.name.charAt(0).toUpperCase()}
           </div>
           <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{emp.name}</h3>
            {emp.role && (
             <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              emp.role.toLowerCase() === 'admin' 
               ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
               : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
             }`}>
              {emp.role}
             </span>
            )}
           </div>
          </div>
         </div>
         
         {emp.email && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
           {emp.email}
          </p>
         )}
         
         <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
           onClick={() => router.push(`/payroll/employeeID/${emp.id}`)}
           className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
           <DollarSign className="w-4 h-4" />
           Lönespec
          </button>
          {isAdmin && (
           <>
            <button
             onClick={() => router.push(`/employees/${emp.id}/edit`)}
             className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
             title="Redigera anställd"
            >
             <Edit2 className="w-4 h-4" />
            </button>
            <button
             onClick={async (e) => {
              e.stopPropagation()
              if (confirm(`Är du säker på att du vill ta bort ${emp.name}? Detta kan inte ångras.`)) {
               try {
                const response = await fetch(`${BASE_PATH}/api/employees/${emp.id}`, {
                 method: 'DELETE',
                })
                const result = await response.json()
                
                if (!response.ok || !result.success) {
                 console.error('Error deleting employee:', result.error)
                 toast.error(result.error || 'Kunde inte ta bort anställd')
                } else {
                 setEmployees(employees.filter(e => e.id !== emp.id))
                 toast.success(result.message || `${emp.name} har tagits bort`)
                }
               } catch (err: any) {
                console.error('Unexpected error:', err)
                toast.error('Ett oväntat fel uppstod: ' + err.message)
               }
              }
             }}
             className="px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
             title="Ta bort anställd"
            >
             <Trash2 className="w-4 h-4" />
            </button>
           </>
          )}
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

