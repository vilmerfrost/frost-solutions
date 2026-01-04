'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { DashboardAnalytics } from '@/components/analytics/DashboardAnalytics'
import AISummary from '@/components/AISummary'
import { toast } from '@/lib/toast'

interface Employee {
 id: string
 name: string
 full_name?: string
 role?: string
 email?: string
}

interface Project {
 id: string
 name: string
 status?: string
}

interface Invoice {
 id: string
 number?: string
 amount: number
 status?: string
 customer_name?: string
}

export default function AdminPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [employees, setEmployees] = useState<Employee[]>([])
 const [projects, setProjects] = useState<Project[]>([])
 const [invoices, setInvoices] = useState<Invoice[]>([])
 const [loading, setLoading] = useState(true)
 const [approvingAll, setApprovingAll] = useState(false)

 async function handleApproveAll() {
  setApprovingAll(true)
  try {
   const res = await fetch('/api/time-entries/approve-all', {
    method: 'POST'
   })

   const data = await res.json()

   if (!res.ok) {
    throw new Error(data.error || 'Kunde inte godkänna tidsrapporter')
   }

   toast.success(
    data.updated
     ? `Godkände ${data.updated} tidsrapporter`
     : 'Alla tidsrapporter godkändes'
   )
  } catch (err: any) {
   toast.error('Fel vid massgodkännande: ' + err.message)
  } finally {
   setApprovingAll(false)
  }
 }

 useEffect(() => {
  if (!tenantId) {
   setLoading(false)
   return
  }

  let cancelled = false

  async function fetchData() {
   if (cancelled) return
   if (!tenantId) return
   
   // TypeScript guard: tenantId is guaranteed to be non-null after the check above
   const currentTenantId = tenantId
   
   try {
    // Employees
    const { data: empData } = await supabase
     .from('employees')
     .select('id, name, full_name, role, email')
     .eq('tenant_id', currentTenantId)
    
    if (cancelled) return
    setEmployees((empData || []).map((e: any) => ({
     id: e.id,
     name: e.full_name || e.name || 'Okänd',
     role: e.role,
     email: e.email,
    })))

    // Projects - Use API route for consistency and better error handling
    try {
     const projectsRes = await fetch(`/api/projects/list?tenantId=${currentTenantId}`, { cache: 'no-store' })
     if (cancelled) return
     
     if (projectsRes.ok) {
      const projectsData = await projectsRes.json()
      if (cancelled) return
      
      if (projectsData.projects) {
       console.log('✅ Admin: Fetched', projectsData.projects.length, 'projects')
       setProjects(projectsData.projects)
      } else {
       setProjects([])
      }
     } else {
      // Fallback: Direct query
      const { data: projData } = await supabase
       .from('projects')
       .select('id, name, status')
       .eq('tenant_id', currentTenantId)
      
      if (cancelled) return
      setProjects(projData || [])
     }
    } catch (projErr) {
     if (cancelled) return
     console.error('Error fetching projects:', projErr)
     // Fallback: Direct query
     const { data: projData } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('tenant_id', currentTenantId)
     
     if (cancelled) return
     setProjects(projData || [])
    }

    // Invoices - progressive fallback
    let { data: invData, error: invError } = await supabase
     .from('invoices')
     .select('id, number, amount, status, customer_name')
     .eq('tenant_id', currentTenantId)
     .order('created_at', { ascending: false })
     .limit(10)
    
    // Fallback if created_at doesn't exist
    if (invError && (invError.code === '42703' || invError.message?.includes('created_at'))) {
     const fallback = await supabase
      .from('invoices')
      .select('id, number, amount, status, customer_name')
      .eq('tenant_id', currentTenantId)
      .limit(10)
     
     if (!fallback.error) {
      invData = fallback.data
     }
    }
    
    if (cancelled) return
    setInvoices(invData || [])
   } catch (err) {
    if (cancelled) return
    console.error('Error fetching admin data:', err)
   } finally {
    if (!cancelled) {
     setLoading(false)
    }
   }
  }

  fetchData()

  // Listen for project updates
  const handleProjectUpdate = () => {
   console.log('🔄 Admin: Project updated, refreshing...')
   if (!cancelled) {
    setTimeout(() => fetchData(), 500)
   }
  }

  window.addEventListener('projectCreated', handleProjectUpdate)
  window.addEventListener('projectUpdated', handleProjectUpdate)

  return () => {
   cancelled = true
   window.removeEventListener('projectCreated', handleProjectUpdate)
   window.removeEventListener('projectUpdated', handleProjectUpdate)
  }
 }, [tenantId])

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

 // Count active projects - projects are active if they are NOT completed or archived
 const activeProjects = projects.filter(p => {
  const status = p.status || null
  return status !== 'completed' && status !== 'archived'
 }).length
 const unpaidInvoices = invoices.filter(i => i.status !== 'paid').length
 const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount || 0), 0)

 return (
  <div className="min-h-screen bg-white flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-1 sm:mb-2">Admin Dashboard</h1>
      <p className="text-sm sm:text-base text-gray-500">Översikt över företaget</p>
      <div className="mt-4">
       <button
        onClick={handleApproveAll}
        disabled={approvingAll}
        className="bg-success-600 hover:bg-success-700 text-white px-5 py-2 rounded-lg font-semibold shadow hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
       >
        {approvingAll ? 'Godkänner alla tidsrapporter...' : 'Godkänn alla tidsrapporter'}
       </button>
      </div>
     </div>

     {/* Stats */}
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-white rounded-[8px] shadow-md p-6 border border-gray-100">
       <div className="text-3xl font-semibold text-blue-600 mb-1">{employees.length}</div>
       <div className="text-sm text-gray-500">Anställda</div>
      </div>
      <div className="bg-white rounded-[8px] shadow-md p-6 border border-gray-100">
       <div className="text-3xl font-semibold text-primary-500 mb-1">{activeProjects}</div>
       <div className="text-sm text-gray-500">Aktiva projekt</div>
      </div>
      <div className="bg-white rounded-[8px] shadow-md p-6 border border-gray-100">
       <div className="text-3xl font-semibold text-primary-500 mb-1">{unpaidInvoices}</div>
       <div className="text-sm text-gray-500">Obetalda fakturor</div>
      </div>
      <div className="bg-white rounded-[8px] shadow-md p-6 border border-gray-100">
       <div className="text-3xl font-semibold text-green-600 mb-1">{totalRevenue.toLocaleString('sv-SE')} kr</div>
       <div className="text-sm text-gray-500">Total omsättning</div>
      </div>
     </div>

     {/* Dashboard Analytics */}
     <div className="mb-6 sm:mb-8">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
       <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
        Analytics & KPI
       </h2>
       <DashboardAnalytics />
      </div>
     </div>

     {/* AI Insights for Admin */}
     <div className="mb-6 sm:mb-8">
      <AISummary
       type="admin-dashboard"
       data={{
        employees: employees.length,
        activeProjects,
        unpaidInvoices,
        totalRevenue,
        projects: projects.slice(0, 10), // Limit for performance
        invoices: invoices.slice(0, 10),
       }}
       className="mb-6 sm:mb-8"
      />
     </div>

     {/* Employees */}
     <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Anställda</h2>
      <div className="bg-white rounded-[8px] shadow-md border border-gray-100 overflow-hidden">
       <div className="overflow-x-auto">
        <table className="w-full text-sm">
         <thead className="bg-gray-50">
          <tr>
           <th className="p-4 text-left font-semibold text-gray-700">Namn</th>
           <th className="p-4 text-left font-semibold text-gray-700">Roll</th>
           <th className="p-4 text-left font-semibold text-gray-700">E-post</th>
           <th className="p-4 text-right font-semibold text-gray-700">Åtgärder</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-gray-100">
          {employees.map((emp) => (
           <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-medium text-gray-900">{emp.name}</td>
            <td className="p-4 text-gray-600">{emp.role || '–'}</td>
            <td className="p-4 text-gray-600">{emp.email || '–'}</td>
            <td className="p-4 text-right">
             <button
              onClick={() => router.push(`/payroll/employeeID/${emp.id}`)}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
             >
              Lönespec →
             </button>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>
     </div>

     {/* Recent Invoices */}
     <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Senaste fakturor</h2>
      <div className="bg-white rounded-[8px] shadow-md border border-gray-100 overflow-hidden">
       <div className="overflow-x-auto">
        <table className="w-full text-sm">
         <thead className="bg-gray-50">
          <tr>
           <th className="p-4 text-left font-semibold text-gray-700">Nummer</th>
           <th className="p-4 text-left font-semibold text-gray-700">Kund</th>
           <th className="p-4 text-right font-semibold text-gray-700">Belopp</th>
           <th className="p-4 text-left font-semibold text-gray-700">Status</th>
           <th className="p-4 text-right font-semibold text-gray-700">Åtgärder</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-gray-100">
          {invoices.map((inv) => (
           <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-medium text-gray-900">{inv.number || inv.id.slice(0, 8)}</td>
            <td className="p-4 text-gray-600">{inv.customer_name || '–'}</td>
            <td className="p-4 text-right font-semibold text-gray-900">
             {Number(inv.amount || 0).toLocaleString('sv-SE')} kr
            </td>
            <td className="p-4">
             <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              inv.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              inv.status === 'paid' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
             }`}>
              {inv.status || 'draft'}
             </span>
            </td>
            <td className="p-4 text-right">
             <button
              onClick={() => router.push(`/invoices/${inv.id}`)}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
             >
              Visa →
             </button>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>
     </div>
    </div>
   </main>
  </div>
 )
}

