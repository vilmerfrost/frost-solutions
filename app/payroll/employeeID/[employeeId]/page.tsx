'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import PayslipExport from '@/components/PayslipExport'

function sek(n: number) {
 try { return Number(n ?? 0).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' }) }
 catch { return `${Math.round(Number(n ?? 0))} kr` }
}

function monthRange(isoMonth?: string) {
 const now = new Date()
 const [y, m] = (isoMonth ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`)
  .split('-')
  .map(Number)
 const start = new Date(y, m - 1, 1)
 const end = new Date(y, m, 1)
 const label = `${y}-${String(m).padStart(2,'0')}`
 return { start: start.toISOString(), end: end.toISOString(), label }
}

export default function PayslipPage() {
 const router = useRouter()
 const params = useParams()
 const searchParams = useSearchParams()
 const { tenantId } = useTenant()
 const employeeId = params?.employeeId as string
 const month = searchParams?.get('month')
 
 const [employee, setEmployee] = useState<any>(null)
 const [entries, setEntries] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedMonth, setSelectedMonth] = useState(month || '')
 const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
 const [currentUserEmployeeId, setCurrentUserEmployeeId] = useState<string | null>(null)
 const [isAdmin, setIsAdmin] = useState(false)

 useEffect(() => {
  if (!tenantId || !employeeId) {
   setLoading(false)
   return
  }

  async function fetchData() {
   try {
    // First, check if user is authorized to view this payslip
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
     setIsAuthorized(false)
     setLoading(false)
     return
    }

    // Get current user's employee record - try with different column names
    if (!tenantId) return
    
    let { data: currentEmployee, error: empCheckError } = await supabase
     .from('employees')
     .select('id, role, auth_user_id')
     .eq('tenant_id', tenantId)
     .eq('auth_user_id', user.id)
     .maybeSingle()

    // If auth_user_id doesn't work, try to find by email
    if (!currentEmployee && user.email && tenantId) {
     const { data: empByEmail } = await supabase
      .from('employees')
      .select('id, role, auth_user_id, email')
      .eq('tenant_id', tenantId)
      .eq('email', user.email)
      .maybeSingle()
     currentEmployee = empByEmail || currentEmployee
    }

    // If still no employee record, try to find ANY employee with this auth_user_id (might be tenant mismatch)
    if (!currentEmployee) {
     const { data: anyEmployee } = await supabase
      .from('employees')
      .select('id, role, auth_user_id, tenant_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
     if (anyEmployee) {
      console.warn('⚠️ Found employee in different tenant:', anyEmployee)
      currentEmployee = anyEmployee
     }
    }

    // Check if user is admin - be more flexible with role matching
    // Also check JWT/app_metadata for admin role
    const emp = currentEmployee as any
    const role = emp?.role?.toLowerCase() || ''
    const userIsAdmin = 
     role === 'admin' || 
     role === 'administrator' || 
     role.includes('admin') ||
     (user.user_metadata as any)?.role === 'admin' ||
     (user.user_metadata as any)?.role === 'Admin' ||
     (user.app_metadata as any)?.role === 'admin' ||
     (user.app_metadata as any)?.role === 'Admin'
    const userEmployeeId = emp?.id || null

    console.log('🔍 Admin check:', { 
     currentEmployee, 
     role, 
     userIsAdmin, 
     userEmployeeId, 
     requestedEmployeeId: employeeId,
     userEmail: user.email,
     userId: user.id,
     tenantId,
     empCheckError,
     userMetadata: user.user_metadata,
     appMetadata: user.app_metadata
    })

    setIsAdmin(userIsAdmin)
    setCurrentUserEmployeeId(userEmployeeId)

    // Special case: If we couldn't find employee record, but user can access the employee data,
    // they might be admin. Try to fetch the requested employee - if it succeeds, allow access.
    if (!currentEmployee) {
     console.warn('⚠️ No employee record found for current user, checking if they can access requested employee...')
     
     // Try to fetch the requested employee via API to bypass RLS
     try {
      const empResponse = await fetch(`/api/employees/${employeeId}`, {
       cache: 'no-store',
      });
      
      if (empResponse.ok) {
       const empData = await empResponse.json();
       if (empData.tenant_id === tenantId) {
        console.warn('⚠️ Allowing access despite missing employee record - employee exists in same tenant')
        setIsAuthorized(true)
       } else {
        console.error('❌ Employee belongs to different tenant')
        setIsAuthorized(false)
        setLoading(false)
        return
       }
      } else {
       console.error('❌ Cannot access requested employee via API')
       setIsAuthorized(false)
       setLoading(false)
       return
      }
     } catch (apiError) {
      console.error('❌ Error checking employee access:', apiError)
      setIsAuthorized(false)
      setLoading(false)
      return
     }
    } else {
     // Normal authorization check: admin can see all, employees can only see their own
     if (!userIsAdmin && userEmployeeId !== employeeId) {
      console.log('❌ Access denied:', { 
       userIsAdmin, 
       userEmployeeId, 
       requestedEmployeeId: employeeId,
       reason: 'Not admin and not own employee ID'
      })
      setIsAuthorized(false)
      setLoading(false)
      return
     }

     console.log('✅ Access granted:', { 
      userIsAdmin, 
      userEmployeeId, 
      requestedEmployeeId: employeeId,
      reason: userIsAdmin ? 'Admin access' : 'Own employee ID'
     })

     setIsAuthorized(true)
    }

    // Fetch employee via server API to avoid RLS issues
    const employeeResponse = await fetch(`/api/employees/${employeeId}`, {
     cache: 'no-store',
    })

    if (!employeeResponse.ok) {
     const errorPayload = await employeeResponse.json().catch(() => ({}))
     console.error('Error fetching employee via API:', errorPayload.error || 'Failed to fetch employee')
     setLoading(false)
     return
    }

    const employeePayload = await employeeResponse.json()
    if (!employeePayload || employeePayload.success === false) {
     console.error('Invalid employee response payload:', employeePayload)
     setLoading(false)
     return
    }

    if (employeePayload.tenant_id && employeePayload.tenant_id !== tenantId) {
     console.error('❌ Employee belongs to different tenant')
     setIsAuthorized(false)
     setLoading(false)
     return
    }

    const normalizedEmployee = {
     id: employeePayload.id,
     full_name: employeePayload.full_name || employeePayload.name || 'Okänd',
     name: employeePayload.name || employeePayload.full_name || 'Okänd',
     email: employeePayload.email || null,
     base_rate_sek: employeePayload.base_rate_sek ?? employeePayload.default_rate_sek ?? null,
     default_rate_sek: employeePayload.default_rate_sek ?? employeePayload.base_rate_sek ?? null,
    }

    setEmployee(normalizedEmployee)

    const { start, end } = monthRange(selectedMonth || undefined)
    
    // Fetch time entries via API route (server-side with admin client)
    const response = await fetch(`/api/payroll/employee/${employeeId}?month=${selectedMonth || ''}`, {
     cache: 'no-store',
    })

    if (!response.ok) {
     const errorData = await response.json().catch(() => ({}))
     console.error('Error fetching time entries:', errorData.error || 'Failed to fetch')
     setEntries([])
    } else {
     const result = await response.json()
     if (result.success && result.entries) {
      setEntries(result.entries)
     } else {
      console.error('Invalid response format:', result)
      setEntries([])
     }
    }
   } catch (err) {
    console.error('Error fetching payslip data:', err)
   } finally {
    setLoading(false)
   }
  }

  fetchData()
 }, [tenantId, employeeId, selectedMonth])

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

 if (isAuthorized === false) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[8px] p-8 text-center max-w-md">
      <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Åtkomst nekad</h2>
      <p className="text-red-600 dark:text-red-400 mb-4">
       Du kan endast se din egen lönespec. Administratörer kan se alla lönespecar.
      </p>
      <button
       onClick={() => router.back()}
       className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
       Tillbaka
      </button>
     </div>
    </main>
   </div>
  )
 }

 if (!employee) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 p-10 flex items-center justify-center">
     <div className="text-red-500 dark:text-red-400">Anställd hittades inte</div>
    </main>
   </div>
  )
 }

 const { label } = monthRange(selectedMonth || undefined)
 const rows = entries || []
 
 // Räkna timmar korrekt - varje entry räknas bara en gång
 const regular = rows.reduce((s, r: any) => {
  return s + (r.ob_type === 'work' || !r.ob_type ? Number(r.hours_total ?? 0) : 0)
 }, 0)
 const eve = rows.reduce((s, r: any) => {
  return s + (r.ob_type === 'evening' ? Number(r.hours_total ?? 0) : 0)
 }, 0)
 const night = rows.reduce((s, r: any) => {
  return s + (r.ob_type === 'night' ? Number(r.hours_total ?? 0) : 0)
 }, 0)
 const weekend = rows.reduce((s, r: any) => {
  return s + (r.ob_type === 'weekend' ? Number(r.hours_total ?? 0) : 0)
 }, 0)
 const totalHours = regular + eve + night + weekend
 
 // Beräkna lön korrekt - använd alltid manuell beräkning baserat på timmar och base_rate
 const baseRate = Number(employee?.base_rate_sek || employee?.default_rate_sek || 360)
 const gross = (regular * baseRate * 1.0) + // Vanlig tid: 100%
        (eve * baseRate * 1.5) + // OB Kväll: 150%
        (night * baseRate * 1.5) + // OB Natt: 150%
        (weekend * baseRate * 2.0) // OB Helg: 200%
 
 const tax = Math.round(gross * 0.30)
 const net = gross - tax

 // Generate month options
 const now = new Date()
 const monthOptions = []
 for (let i = 0; i < 12; i++) {
  const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const label = date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })
  monthOptions.push({ value, label })
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Lönespec</h1>
       <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{employee?.full_name || employee?.name || 'Okänd anställd'}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
       <PayslipExport
        targetId="payslip-content"
        fileName={`lonespec-${label}-${employee?.full_name || employee?.name || 'anstalld'}.pdf`}
        data={{
         employee: {
          name: employee?.full_name || employee?.name || 'Okänd',
          email: employee?.email || undefined,
         },
         label,
         regular,
         eve,
         night,
         weekend,
         totalHours,
         gross,
         tax,
         net,
         baseRate,
        }}
       />
       <button
        onClick={() => router.back()}
        className="px-6 py-3 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
       >
        Tillbaka
       </button>
      </div>
     </div>

     <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Välj månad</label>
      <select
       value={selectedMonth}
       onChange={(e) => {
        setSelectedMonth(e.target.value)
        router.push(`/payroll/employeeID/${employeeId}?month=${e.target.value}`)
       }}
       className="w-full sm:w-auto px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
      >
       {monthOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
       ))}
      </select>
     </div>

     <div id="payslip-content" className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lönespec – {label}</h2>
       <p className="text-gray-600 dark:text-gray-400">{employee.full_name || employee.name || 'Okänd anställd'}</p>
       {employee.email && <p className="text-sm text-gray-500 dark:text-gray-500">{employee.email}</p>}
      </div>

      <div className="space-y-4 mb-6">
       <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-[8px] border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-center mb-2">
         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Grundlön per timme</span>
         <span className="font-bold text-gray-900 dark:text-white">
          {sek(Number(employee.base_rate_sek || employee.default_rate_sek || 360))}
         </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
         OB-tillägg: Kväll/Natt 150%, Helg 200% (byggkollektivavtalet)
        </p>
       </div>
       
       <div className="flex justify-between py-2">
        <span className="text-gray-600 dark:text-gray-400">Vanliga timmar ({sek(Number(employee.base_rate_sek || employee.default_rate_sek || 360))}/tim)</span>
        <span className="font-semibold">{regular.toFixed(1)}h = {sek(regular * Number(employee.base_rate_sek || employee.default_rate_sek || 360) * 1.0)}</span>
       </div>
       <div className="flex justify-between py-2">
        <span className="text-gray-600 dark:text-gray-400">OB Kväll (150%)</span>
        <span className="font-semibold">{eve.toFixed(1)}h = {sek(eve * Number(employee.base_rate_sek || employee.default_rate_sek || 360) * 1.5)}</span>
       </div>
       <div className="flex justify-between py-2">
        <span className="text-gray-600 dark:text-gray-400">OB Natt (150%)</span>
        <span className="font-semibold">{night.toFixed(1)}h = {sek(night * Number(employee.base_rate_sek || employee.default_rate_sek || 360) * 1.5)}</span>
       </div>
       <div className="flex justify-between py-2">
        <span className="text-gray-600 dark:text-gray-400">OB Helg (200%)</span>
        <span className="font-semibold">{weekend.toFixed(1)}h = {sek(weekend * Number(employee.base_rate_sek || employee.default_rate_sek || 360) * 2.0)}</span>
       </div>
       <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700 pt-2">
        <span className="font-semibold text-gray-900 dark:text-white">Totalt timmar</span>
        <span className="font-bold text-lg text-gray-900 dark:text-white">{totalHours.toFixed(1)}h</span>
       </div>
      </div>

      <div className="bg-primary-500 hover:bg-primary-600 dark:/20 dark:/20 rounded-[8px] p-6 space-y-3 border border-blue-200 dark:border-blue-800">
       <div className="flex justify-between text-lg">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Bruttolön</span>
        <span className="font-bold text-gray-900 dark:text-white">{sek(gross)}</span>
       </div>
       <div className="flex justify-between text-gray-600 dark:text-gray-400">
        <span>Skatt (30%)</span>
        <span>-{sek(tax)}</span>
       </div>
       <div className="flex justify-between pt-3 border-t-2 border-gray-300 dark:border-gray-600 text-xl">
        <span className="font-bold text-gray-900 dark:text-white">Netto</span>
        <span className="font-semibold text-primary-500 dark:text-primary-400">{sek(net)}</span>
       </div>
      </div>
     </div>
    </div>
   </main>
  </div>
 )
}

