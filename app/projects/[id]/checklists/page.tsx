'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import Sidebar from '@/components/Sidebar'

interface Checklist {
  id: string
  name: string
  status: 'draft' | 'in_progress' | 'completed' | 'signed_off'
  assigned_to: string | null
  template_id: string | null
  signed_by: string | null
  signed_at: string | null
  created_at: string
}

interface ChecklistTemplate {
  id: string
  name: string
  category: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Utkast', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'Pågående', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  completed: { label: 'Klar', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  signed_off: { label: 'Signerad', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
}

export default function ChecklistsPage() {
  const router = useRouter()
  const { id: projectId } = useParams<{ id: string }>()
  const { tenantId } = useTenant()
  const { isAdmin, role } = useAdmin()

  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    if (!tenantId || !projectId) return
    fetchChecklists()
    fetchTemplates()
  }, [tenantId, projectId])

  async function fetchChecklists() {
    try {
      const url = statusFilter
        ? `/api/projects/${projectId}/checklists?status=${statusFilter}`
        : `/api/projects/${projectId}/checklists`
      const res: any = await apiFetch(url)
      setChecklists(res.checklists || [])
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTemplates() {
    try {
      const res: any = await apiFetch('/api/templates/checklists')
      setTemplates(res.templates || [])
    } catch {
      // Templates may not exist yet
    }
  }

  async function handleCreateChecklist(templateId: string) {
    try {
      const res: any = await apiFetch(`/api/projects/${projectId}/checklists`, {
        method: 'POST',
        body: JSON.stringify({ templateId }),
      })
      setShowTemplateModal(false)
      router.push(`/projects/${projectId}/checklists/${res.checklistId}`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    if (tenantId && projectId) fetchChecklists()
  }, [statusFilter])

  if (!tenantId) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Egenkontroller</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Kvalitetskontroller för projektet</p>
            </div>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] text-sm font-medium transition-colors"
            >
              Ny egenkontroll
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            {[
              { value: '', label: 'Alla' },
              { value: 'draft', label: 'Utkast' },
              { value: 'in_progress', label: 'Pågående' },
              { value: 'completed', label: 'Klara' },
              { value: 'signed_off', label: 'Signerade' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-sm rounded-[8px] transition-colors ${
                  statusFilter === f.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          )}

          {!loading && checklists.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inga egenkontroller ännu</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Skapa en ny egenkontroll från en mall</p>
            </div>
          )}

          {!loading && checklists.length > 0 && (
            <div className="space-y-3">
              {checklists.map((cl) => {
                const statusInfo = STATUS_LABELS[cl.status] || STATUS_LABELS.draft
                return (
                  <div
                    key={cl.id}
                    onClick={() => router.push(`/projects/${projectId}/checklists/${cl.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{cl.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(cl.created_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {showTemplateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-[8px] p-6 w-full max-w-md mx-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Välj mall</h2>
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Inga mallar skapade ännu. Skapa en mall under Inställningar → Mallar.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleCreateChecklist(t.id)}
                        className="w-full text-left p-3 rounded-[8px] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                        {t.category && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.category}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="mt-4 w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
