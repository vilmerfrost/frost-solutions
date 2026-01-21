'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'
import { DollarSign, Edit2, Trash2 } from 'lucide-react'

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

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Anställda</h1>
       <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Hantera dina anställda</p>
      </div>
      {isAdmin && (
       <button
        onClick={() => router.push('/employees/new')}
        className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm sm:text-base"
       >
        + Lägg till anställd
       </button>
      )}
     </div>

     {employees.length === 0 ? (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400">
       <p className="mb-4">Inga anställda hittades.</p>
       {isAdmin && (
        <button
         onClick={() => router.push('/employees/new')}
         className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
        >
         + Lägg till första anställde
        </button>
       )}
      </div>
     ) : (
      <>
       <div className="mb-4 text-right">
        <p className="text-xs text-gray-400 dark:text-gray-500">
         Totalt: {employees.length} anställda • {employees.length * 89} kr/månad
        </p>
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {employees.map((emp) => (
         <div
          key={emp.id}
          onClick={() => router.push(`/payroll/employeeID/${emp.id}`)}
          className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
         >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{emp.name}</h3>
          {emp.role && (
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 capitalize">{emp.role}</p>
          )}
          {emp.email && (
           <p className="text-xs text-gray-400 dark:text-gray-500">{emp.email}</p>
          )}
          <div className="mt-4 flex gap-2">
           <button
            onClick={(e) => {
             e.stopPropagation()
             router.push(`/payroll/employeeID/${emp.id}`)
            }}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
           >
            <DollarSign className="w-4 h-4" />
            Lönespec
           </button>
           {isAdmin && (
            <>
             <button
              onClick={(e) => {
               e.stopPropagation()
               router.push(`/employees/${emp.id}/edit`)
              }}
              className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-all"
              title="Redigera anställd"
             >
              <Edit2 className="w-4 h-4" />
             </button>
             <button
              onClick={async (e) => {
               e.stopPropagation()
               if (confirm(`Är du säker på att du vill ta bort ${emp.name}? Detta kan inte ångras.`)) {
                try {
                 const { error } = await supabase
                  .from('employees')
                  .delete()
                  .eq('id', emp.id)
                  .eq('tenant_id', tenantId as string)
                 
                 if (error) {
                  console.error('Error deleting employee:', error)
                  toast.error('Kunde inte ta bort anställd: ' + error.message)
                 } else {
                  // Remove from local state
                  setEmployees(employees.filter(e => e.id !== emp.id))
                  toast.success(`${emp.name} har tagits bort`)
                 }
                } catch (err: any) {
                 console.error('Unexpected error:', err)
                 toast.error('Ett oväntat fel uppstod: ' + err.message)
                }
               }
              }}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
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
      </>
     )}
    </div>
   </main>
  </div>
 )
}

