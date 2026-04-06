'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import Sidebar from '@/components/Sidebar'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CaseStatus = 'ny' | 'pagaende' | 'atgardad' | 'godkand'
type CasePriority = 'low' | 'medium' | 'high' | 'critical'
type CaseSource = 'checklist' | 'annotation' | 'manual'

interface Case {
  id: string
  title: string
  status: CaseStatus
  priority: CasePriority
  source: CaseSource
  due_date: string | null
  assigned_to: string | null
  description: string | null
  created_at: string
}

interface CreateCasePayload {
  title: string
  priority: CasePriority
  description: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COLUMNS: { key: CaseStatus; label: string; headerClass: string }[] = [
  {
    key: 'ny',
    label: 'Ny',
    headerClass: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
  },
  {
    key: 'pagaende',
    label: 'Pågående',
    headerClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
  {
    key: 'atgardad',
    label: 'Åtgärdad',
    headerClass: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  },
  {
    key: 'godkand',
    label: 'Godkänd',
    headerClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
]

const PRIORITY_LABELS: Record<CasePriority, string> = {
  low: 'Låg',
  medium: 'Medium',
  high: 'Hög',
  critical: 'Kritisk',
}

const PRIORITY_BADGE: Record<CasePriority, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const SOURCE_ICON: Record<CaseSource, string> = {
  checklist: '📋',
  annotation: '✏️',
  manual: '👤',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CasesKanbanPage() {
  const router = useRouter()
  const { id: projectId } = useParams<{ id: string }>()
  const { tenantId } = useTenant()
  const { isAdmin, role } = useAdmin()

  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | ''>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Create form state
  const [createTitle, setCreateTitle] = useState('')
  const [createPriority, setCreatePriority] = useState<CasePriority>('medium')
  const [createDescription, setCreateDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!tenantId || !projectId) return
    fetchCases()
  }, [tenantId, projectId])

  async function fetchCases() {
    try {
      setLoading(true)
      const res: any = await apiFetch(`/api/projects/${projectId}/cases`)
      setCases(res.cases || [])
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!createTitle.trim()) {
      toast.error('Titel krävs')
      return
    }
    setCreating(true)
    try {
      await apiFetch(`/api/projects/${projectId}/cases`, {
        method: 'POST',
        body: JSON.stringify({
          title: createTitle.trim(),
          priority: createPriority,
          description: createDescription.trim(),
        } satisfies CreateCasePayload),
      })
      toast.success('Ärende skapat')
      setShowCreateModal(false)
      setCreateTitle('')
      setCreatePriority('medium')
      setCreateDescription('')
      fetchCases()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  function handleCloseModal() {
    setShowCreateModal(false)
    setCreateTitle('')
    setCreatePriority('medium')
    setCreateDescription('')
  }

  // Derive unique assignees for filter dropdown
  const assignees = Array.from(
    new Set(cases.map((c) => c.assigned_to).filter(Boolean) as string[])
  )

  // Filter cases
  const filteredCases = cases.filter((c) => {
    if (priorityFilter && c.priority !== priorityFilter) return false
    if (assigneeFilter && c.assigned_to !== assigneeFilter) return false
    return true
  })

  function getCasesForColumn(status: CaseStatus): Case[] {
    return filteredCases.filter((c) => c.status === status)
  }

  if (!tenantId) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Ärenden</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Hantera och följ upp projektärenden
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Priority filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as CasePriority | '')}
                className="px-3 py-2 text-sm rounded-[8px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Alla prioriteter</option>
                {(Object.keys(PRIORITY_LABELS) as CasePriority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>

              {/* Assignee filter */}
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-[8px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Alla ansvariga</option>
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] text-sm font-medium transition-colors"
              >
                Nytt ärende
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          )}

          {/* Kanban board */}
          {!loading && (
            <div className="grid grid-cols-4 gap-4">
              {COLUMNS.map((col) => {
                const columnCases = getCasesForColumn(col.key)
                return (
                  <div key={col.key} className="flex flex-col">
                    {/* Column header */}
                    <div
                      className={`px-4 py-2.5 rounded-t-[8px] flex items-center justify-between ${col.headerClass}`}
                    >
                      <span className="text-sm font-semibold">{col.label}</span>
                      <span className="text-xs font-medium opacity-70 bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">
                        {columnCases.length}
                      </span>
                    </div>

                    {/* Column body */}
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800/50 rounded-b-[8px] p-2 space-y-2 min-h-[200px]">
                      {columnCases.length === 0 && (
                        <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
                          Inga ärenden
                        </div>
                      )}

                      {columnCases.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => router.push(`/projects/${projectId}/cases/${c.id}`)}
                          className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-all cursor-pointer"
                        >
                          {/* Title */}
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug mb-2">
                            {c.title}
                          </p>

                          {/* Priority badge + source icon */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[c.priority]}`}
                            >
                              {PRIORITY_LABELS[c.priority]}
                            </span>
                            <span
                              className="text-base"
                              title={c.source}
                              aria-label={c.source}
                            >
                              {SOURCE_ICON[c.source] ?? '👤'}
                            </span>
                          </div>

                          {/* Due date */}
                          {c.due_date && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Deadline:{' '}
                              {new Date(c.due_date).toLocaleDateString('sv-SE')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Quick-create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-[8px] p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Nytt ärende
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Beskriv ärendet kortfattat..."
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prioritet
                </label>
                <select
                  value={createPriority}
                  onChange={(e) => setCreatePriority(e.target.value as CasePriority)}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {(Object.keys(PRIORITY_LABELS) as CasePriority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beskrivning{' '}
                  <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                    (valfritt)
                  </span>
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Ytterligare information om ärendet..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating || !createTitle.trim()}
                className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[8px] text-sm font-medium transition-colors"
              >
                {creating ? 'Skapar...' : 'Skapa'}
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-[8px] text-sm font-medium transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
