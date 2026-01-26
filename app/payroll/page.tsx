// app/payroll/page.tsx
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'
import Sidebar from '@/components/Sidebar'
import ExportCSV from './ExportCSV'
import Link from 'next/link'
import { ExportPayrollButton } from '@/components/integrations/ExportPayrollButton'
import PayrollPageClient from './PayrollPageClient'

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
 return { start: start.toISOString(), end: end.toISOString(), label: `${y}-${String(m).padStart(2,'0')}` }
}

export default async function PayrollPage({ searchParams }: { searchParams?: Record<string, string> }) {
 const supabase = createClient()
 const { data: authData } = await supabase.auth.getUser()
 const user = authData?.user
 if (!user) {
  return <div className="mx-auto max-w-xl p-8">Du är inte inloggad. <Link className="underline" href="/login">Logga in</Link></div>
 }

 // Use unified tenant resolution
 const tenantId = await getTenantId()
 if (!tenantId) {
  return <div className="mx-auto max-w-xl p-8">Saknar tenant_id. Kontakta admin.</div>
 }

 const { start, end, label } = monthRange(searchParams?.month)

 // Employees
 const { data: employeesData } = await supabase
  .from('employees')
  .select('id, full_name, email, default_rate_sek')
  .eq('tenant_id', tenantId)
  .order('full_name', { ascending: true })
 const employees = employeesData ?? []

 const nameById = new Map<string, { name: string; email: string }>(
  employees.map((e: any) => [e.id as string, { name: (e.full_name as string) ?? 'Okänd', email: (e.email as string) ?? '' }])
 )

 // Entries - använd hours_total och ob_type (data sparas så från reports/new)
 // Use admin client to bypass RLS and ensure all entries are fetched
 const { createAdminClient } = await import('@/utils/supabase/admin')
 const admin = createAdminClient()
 
 const { data: entriesData, error: entriesError } = await admin
  .from('time_entries')
  .select('employee_id, hours_total, ob_type, amount_total, date')
  .eq('tenant_id', tenantId)
  .gte('date', start.split('T')[0])
  .lt('date', end.split('T')[0])
 
 if (entriesError) {
  console.error('❌ Payroll: Error fetching entries:', entriesError)
 }
 
 const entries = entriesData ?? []
 
 // Debug logging
 console.log('📊 Payroll: Fetched entries', {
  tenantId,
  period: { start: start.split('T')[0], end: end.split('T')[0] },
  entriesCount: entries.length,
  sample: entries.slice(0, 3).map((e: any) => ({
   employee_id: e.employee_id,
   date: e.date,
   hours: e.hours_total,
   ob_type: e.ob_type,
  })),
 })

 type Agg = {
  employee_id: string
  name: string
  email: string
  regular: number
  eve: number
  night: number
  weekend: number
  total_hours: number
  amount: number
 }
 const byEmp = new Map<string, Agg>()
 for (const r of entries as any[]) {
  const id = r?.employee_id as string
  if (!id) continue
  if (!byEmp.has(id)) {
   const meta = nameById.get(id) ?? { name: 'Okänd', email: '' }
   byEmp.set(id, {
    employee_id: id,
    name: meta.name,
    email: meta.email,
    regular: 0, eve: 0, night: 0, weekend: 0,
    total_hours: 0, amount: 0,
   })
  }
  const a = byEmp.get(id)!
  const hours = Number(r?.hours_total ?? 0)
  const obType = r?.ob_type || 'work'
  // Kategorisera timmar baserat på ob_type
  if (obType === 'work') {
   a.regular += hours
  } else if (obType === 'evening') {
   a.eve += hours
  } else if (obType === 'night') {
   a.night += hours
  } else if (obType === 'weekend') {
   a.weekend += hours
  }
  a.total_hours += hours
  a.amount += Number(r?.amount_total ?? 0)
 }
 const rows = Array.from(byEmp.values()).sort((a, b) => a.name.localeCompare(b.name))

 const grandHours = rows.reduce((s, r) => s + (r?.total_hours ?? 0), 0)
 const grandAmount = rows.reduce((s, r) => s + (r?.amount ?? 0), 0)

 const csv = rows.map(r => ({
  Månad: label,
  Namn: r.name,
  Epost: r.email,
  'Ordinarie (tim)': r.regular.toFixed(2),
  'OB Kväll (tim)': r.eve.toFixed(2),
  'OB Natt (tim)': r.night.toFixed(2),
  'OB Helg (tim)': r.weekend.toFixed(2),
  'Totalt (tim)': r.total_hours.toFixed(2),
  'Belopp (SEK)': Number(r.amount ?? 0).toFixed(2),
 }))

 // Check if user is admin
 const { data: employeeData } = await supabase
  .from('employees')
  .select('role')
  .eq('auth_user_id', user.id)
  .eq('tenant_id', tenantId)
  .maybeSingle()
 
 const isAdmin = employeeData?.role === 'admin' || 
         employeeData?.role === 'Admin' || 
         employeeData?.role?.toLowerCase() === 'admin'

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     {/* Header */}
     <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
       <div className="flex items-center gap-4">
        <div className="p-3 bg-primary-500 rounded-lg shadow-md">
         <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
         </svg>
        </div>
        <div>
         <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lönespec</h1>
         <p className="text-gray-600 dark:text-gray-400">{label}</p>
        </div>
       </div>
       <div className="flex gap-2 flex-wrap">
        <ExportCSV rows={csv} fileName={`payroll-${label}.csv`} />
        {isAdmin && (
         <PayrollPageClient month={label}>
          <ExportPayrollButton month={label} />
         </PayrollPageClient>
        )}
       </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Anställda</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{rows.length}</p>
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Totalt timmar</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{grandHours.toFixed(1)}h</p>
         </div>
         <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
         </div>
        </div>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Registreringar</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{entries.length}</p>
         </div>
         <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
         </div>
        </div>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total lön</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{sek(grandAmount)}</p>
         </div>
         <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
         </div>
        </div>
       </div>
      </div>
     </div>

     {/* Period Info */}
     <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
       Visar registreringar från <span className="font-medium text-gray-900 dark:text-white">{new Date(start).toLocaleDateString('sv-SE')}</span> till{' '}
       <span className="font-medium text-gray-900 dark:text-white">{new Date(end).toLocaleDateString('sv-SE')}</span>
      </p>
     </div>

     {/* Employees Table */}
     <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
       <table className="min-w-full text-sm">
        <thead>
         <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Namn</th>
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">E-post</th>
          <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Ordinarie</th>
          <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">OB Kväll</th>
          <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">OB Natt</th>
          <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">OB Helg</th>
          <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Totalt</th>
          <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">Belopp</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
         {rows.length === 0 && (
          <tr>
           <td className="p-8 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
            <div className="flex flex-col items-center gap-2">
             <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
             </svg>
             <p>Inga registreringar denna period</p>
            </div>
           </td>
          </tr>
         )}
         {rows.map((r) => (
          <tr key={r.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
           <td className="p-4 text-gray-900 dark:text-white font-medium">
            <Link href={`/payroll/employeeID/${r.employee_id}?month=${label}`} className="text-primary-600 dark:text-primary-400 hover:underline">
             {r.name}
            </Link>
           </td>
           <td className="p-4 text-gray-600 dark:text-gray-400">{r.email}</td>
           <td className="p-4 text-right text-gray-900 dark:text-white">{r.regular.toFixed(1)}h</td>
           <td className="p-4 text-right text-gray-900 dark:text-white">{r.eve.toFixed(1)}h</td>
           <td className="p-4 text-right text-gray-900 dark:text-white">{r.night.toFixed(1)}h</td>
           <td className="p-4 text-right text-gray-900 dark:text-white">{r.weekend.toFixed(1)}h</td>
           <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">{r.total_hours.toFixed(1)}h</td>
           <td className="p-4 text-right font-bold text-primary-600 dark:text-primary-400">{sek(r.amount)}</td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     </div>
    </div>
   </main>
  </div>
 )
}

