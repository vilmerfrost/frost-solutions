'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'

export default function AdminDebugPage() {
  const { tenantId } = useTenant()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function gatherDebugInfo() {
      const info: any = {
        timestamp: new Date().toISOString(),
        tenantId,
        user: null,
        employeeData: null,
        adminCheckAPI: null,
        errors: [],
      }

      try {
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        info.user = {
          id: user?.id,
          email: user?.email,
          user_metadata: user?.user_metadata,
          app_metadata: user?.app_metadata,
        }
        if (userError) info.errors.push(`User error: ${userError.message}`)

        if (!user) {
          info.errors.push('No user found')
          setDebugInfo(info)
          setLoading(false)
          return
        }

        // Try direct query
        try {
          const { data: empData, error: empError } = await supabase
            .from('employees')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle()

          const emp = empData as any
          info.employeeData = {
            data: empData,
            error: empError?.message,
            found: !!empData,
            role: emp?.role,
            isAdmin: emp?.role === 'admin' || emp?.role === 'Admin',
          }
        } catch (err: any) {
          info.errors.push(`Employee query error: ${err.message}`)
        }

        // Try API route
        try {
          const res = await fetch('/api/admin/check')
          const apiData = await res.json()
          info.adminCheckAPI = {
            status: res.status,
            ok: res.ok,
            data: apiData,
          }
        } catch (err: any) {
          info.errors.push(`Admin check API error: ${err.message}`)
        }

        // Try fix-role API to see if it can create/update
        try {
          const fixRes = await fetch('/api/admin/fix-role', { method: 'POST' })
          const fixData = await fixRes.json()
          info.fixRoleAPI = {
            status: fixRes.status,
            ok: fixRes.ok,
            data: fixData,
          }
        } catch (err: any) {
          info.errors.push(`Fix role API error: ${err.message}`)
        }

        // Try with tenant filter
        if (tenantId) {
          try {
            const { data: empWithTenant, error: tenantError } = await supabase
              .from('employees')
              .select('*')
              .eq('auth_user_id', user.id)
              .eq('tenant_id', tenantId)
              .maybeSingle()

            const empTenant = empWithTenant as any
            info.employeeWithTenant = {
              data: empWithTenant,
              error: tenantError?.message,
              found: !!empWithTenant,
              role: empTenant?.role,
              isAdmin: empTenant?.role === 'admin' || empTenant?.role === 'Admin',
            }
          } catch (err: any) {
            info.errors.push(`Employee with tenant query error: ${err.message}`)
          }
        }
      } catch (err: any) {
        info.errors.push(`General error: ${err.message}`)
      }

      setDebugInfo(info)
      setLoading(false)
    }

    gatherDebugInfo()
  }, [tenantId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-10">
          <div className="text-center py-20 text-gray-500">Laddar debug-info...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-6">
            🔍 Admin Debug Info
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <pre className="text-xs overflow-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Snabbfix
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">1. Kontrollera employee-record:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gå till Supabase Dashboard → Table Editor → employees
                  <br />
                  Hitta din rad (via auth_user_id eller email)
                  <br />
                  Kontrollera att <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">role</code> är <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">admin</code>
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2">2. Fixa admin automatiskt:</p>
                {debugInfo?.employeeData?.found === false && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-1">
                      ⚠️ Ingen employee record hittades!
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Detta kommer att skapa en ny employee record med admin-role.
                    </p>
                  </div>
                )}
                {debugInfo?.fixRoleAPI && (
                  <div className={`rounded-lg p-3 mb-3 border ${
                    debugInfo.fixRoleAPI.ok 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${
                      debugInfo.fixRoleAPI.ok
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {debugInfo.fixRoleAPI.ok ? '✅' : '❌'} Fix Role API Test:
                    </p>
                    <p className={`text-xs ${
                      debugInfo.fixRoleAPI.ok
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {debugInfo.fixRoleAPI.ok 
                        ? debugInfo.fixRoleAPI.data.message || 'Success'
                        : debugInfo.fixRoleAPI.data.error || 'Unknown error'
                      }
                    </p>
                  </div>
                )}
                <button
                  onClick={async () => {
                    const message = debugInfo?.employeeData?.found === false
                      ? 'Detta kommer att SKAPA en ny employee record med admin-role. Fortsätt?'
                      : 'Detta kommer att sätta din role till admin. Fortsätt?'
                    
                    if (confirm(message)) {
                      try {
                        const res = await fetch('/api/admin/fix-role', { method: 'POST' })
                        const data = await res.json()
                        
                        if (res.ok) {
                          alert(`✅ ${data.created ? 'Employee record skapad' : 'Admin-role uppdaterad'}!\n\nEmployee ID: ${data.employeeId}\nTenant ID: ${data.tenantId}\n\nLadda om sidan nu.`)
                          setTimeout(() => {
                            window.location.reload()
                          }, 1000)
                        } else {
                          alert(`❌ Fel: ${data.error}\n\nKontrollera console för mer detaljer.`)
                          console.error('Fix role error:', data)
                        }
                      } catch (err: any) {
                        alert(`❌ Fel: ${err.message}`)
                        console.error('Fix role exception:', err)
                      }
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold mt-2"
                >
                  {debugInfo?.employeeData?.found === false ? '✨ Skapa employee record som admin' : '🔧 Sätt mig som admin'}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Eller uppdatera manuellt i Supabase:
                  <br />
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded block mt-2">
                    UPDATE employees SET role = 'admin' WHERE auth_user_id = '{debugInfo?.user?.id || 'YOUR_USER_ID'}';
                  </code>
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2">3. Kontrollera tenant_id:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Se till att din employee-record har rätt <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">tenant_id</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

