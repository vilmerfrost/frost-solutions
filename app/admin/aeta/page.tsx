'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import AISummary from '@/components/AISummary'

interface AetaRequest {
  id: string
  project_id: string
  description: string
  hours: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  requested_by: string
  admin_notes?: string | null
  attachment_url?: string | null
  attachment_name?: string | null
  projects?: { name: string }
  employees?: { full_name: string } | null
}

export default function AdminAetaPage() {
  const router = useRouter()
  const { tenantId } = useTenant()
  const [requests, setRequests] = useState<AetaRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (tenantId) {
      loadRequests()
    }
  }, [tenantId, filter])

  async function loadRequests() {
    if (!tenantId) return

    setLoading(true)
    try {
      const statusParam = filter === 'all' ? null : filter
      
      // Try to fetch with relations first
      let query = supabase
        .from('aeta_requests')
        .select(`
          *,
          projects(name),
          employees(full_name, id)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (statusParam) {
        query = query.eq('status', statusParam)
      }

      let { data, error } = await query

      // If relation fails, fetch without relations and enrich manually
      if (error && (error.code === 'PGRST200' || error.message?.includes('relationship') || error.message?.includes('Could not find a relationship'))) {
        // Fetch without relations
        let simpleQuery = supabase
          .from('aeta_requests')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        if (statusParam) {
          simpleQuery = simpleQuery.eq('status', statusParam)
        }

        const { data: simpleData, error: simpleError } = await simpleQuery

        if (simpleError) {
          console.error('Error loading AETA requests (simple query):', simpleError)
          setRequests([])
          return
        }

        // Enrich with project and employee names
        if (simpleData && simpleData.length > 0) {
          const projectIds = [...new Set(simpleData.map((r: any) => r.project_id).filter(Boolean))]
          const employeeIds = [...new Set(simpleData.map((r: any) => r.employee_id).filter(Boolean))]

          // Fetch projects
          let projects: any[] = []
          if (projectIds.length > 0) {
            const { data: projData } = await supabase
              .from('projects')
              .select('id, name')
              .in('id', projectIds)
            projects = projData || []
          }

          // Fetch employees
          let employees: any[] = []
          if (employeeIds.length > 0) {
            const { data: empData } = await supabase
              .from('employees')
              .select('id, full_name, name')
              .in('id', employeeIds)
            employees = empData || []
          }

          // Enrich the requests
          const enriched = simpleData.map((req: any) => ({
            ...req,
            projects: projects.find(p => p.id === req.project_id) ? { name: projects.find(p => p.id === req.project_id)?.name } : null,
            employees: employees.find(e => e.id === req.employee_id) ? { full_name: employees.find(e => e.id === req.employee_id)?.full_name || employees.find(e => e.id === req.employee_id)?.name } : null,
          }))

          setRequests(enriched as any)
          return
        }

        setRequests([])
        return
      }

      if (error) {
        console.error('Error loading AETA requests:', error)
        setRequests([])
      } else {
        setRequests((data as any) || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    setReviewingId(id)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      const { error } = await (supabase
        .from('aeta_requests') as any)
        .update({
          status,
          admin_notes: adminNotes || null,
          approved_by: status === 'approved' ? userId : null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        toast.error('Kunde inte uppdatera förfrågan: ' + error.message)
      } else {
        // Om godkänd, skapa time_entry
        if (status === 'approved') {
          const request = requests.find(r => r.id === id)
          if (request && tenantId) {
            const requestData = request as any
            
            // Build time entry payload progressively
            const timeEntryPayload: any = {
              project_id: request.project_id,
              employee_id: requestData.employee_id || null,
              tenant_id: tenantId,
              date: new Date().toISOString().split('T')[0],
              hours_total: request.hours,
              ob_type: 'work',
              is_billed: false,
              amount_total: 0,
            }

            // Try to add description if column exists
            let result = await supabase
              .from('time_entries')
              .insert([{
                ...timeEntryPayload,
                description: `ÄTA: ${request.description}`,
              }] as any)

            // If description column doesn't exist, try without it
            if (result.error && (result.error.code === '42703' || result.error.message?.includes('description'))) {
              result = await supabase
                .from('time_entries')
                .insert([timeEntryPayload] as any)
            }

            if (result.error) {
              console.error('Error creating time entry:', result.error)
              toast.error('Förfrågan godkänd, men kunde inte skapa time_entry: ' + result.error.message)
            }
          }
        }

        setAdminNotes('')
        toast.success('Förfrågan uppdaterad!')
        await loadRequests()
      }
    } catch (err: any) {
      toast.error('Ett oväntat fel uppstod: ' + err.message)
    } finally {
      setReviewingId(null)
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">Admin - ÄTA-förfrågningar</h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Godkänn eller avvisa ÄTA-förfrågningar</p>
            </div>
            {pendingCount > 0 && (
              <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
                {pendingCount} väntar på godkännande
              </span>
            )}
          </div>

          {/* AI Insights for ÄTA Requests */}
          {requests.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <AISummary
                type="admin-dashboard"
                data={{
                  employees: 0,
                  activeProjects: requests.filter(r => r.status === 'pending').length,
                  unpaidInvoices: 0,
                  totalRevenue: 0,
                  projects: [],
                  invoices: [],
                  aetaRequests: requests.slice(0, 10),
                }}
              />
            </div>
          )}

          {/* Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-semibold transition ${
                  filter === f
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {f === 'all' ? 'Alla' : f === 'pending' ? 'Väntar' : f === 'approved' ? 'Godkända' : 'Avvisade'}
              </button>
            ))}
          </div>

          {/* Lista */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
              Laddar...
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
              Inga ÄTA-förfrågningar {filter !== 'all' ? `med status "${filter}"` : ''}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 ${
                    request.status === 'pending'
                      ? 'border-yellow-400 dark:border-yellow-500'
                      : request.status === 'approved'
                      ? 'border-green-500 dark:border-green-400'
                      : 'border-red-500 dark:border-red-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {request.projects?.name || 'Okänt projekt'}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status === 'pending' ? 'Väntar' : request.status === 'approved' ? 'Godkänd' : 'Avvisad'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{request.description}</p>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span className="font-semibold">{request.hours} timmar</span>
                        {request.employees && (
                          <> • Anställd: {request.employees.full_name}</>
                        )}
                        {' • '}
                        {new Date(request.created_at).toLocaleDateString('sv-SE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {(request.attachment_url || request.attachment_name) && (
                        <div className="mt-2 mb-2">
                          <a
                            href={request.attachment_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-semibold"
                          >
                            📎 {request.attachment_name || 'Bifogning'}
                          </a>
                        </div>
                      )}
                      {request.admin_notes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-semibold">Admin-notering:</span> {request.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3 resize-none"
                        rows={3}
                        placeholder="Admin-notering (valfritt)..."
                        value={reviewingId === request.id ? adminNotes : ''}
                        onChange={(e) => setAdminNotes(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(request.id, 'approved')}
                          disabled={reviewingId === request.id}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✓ Godkänn
                        </button>
                        <button
                          onClick={() => handleReview(request.id, 'rejected')}
                          disabled={reviewingId === request.id}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✗ Avvisa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
