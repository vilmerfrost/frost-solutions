'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import { canManageCases } from '@/lib/binders/permissions'
import Sidebar from '@/components/Sidebar'

interface CaseComment {
  id: string
  author_id: string
  body: string
  created_at: string
}

interface Case {
  id: string
  title: string
  description: string | null
  status: 'ny' | 'pagaende' | 'atgardad' | 'godkand'
  priority: 'low' | 'medium' | 'high' | 'critical'
  due_date: string | null
  source_type: string | null
  photos: string[]
  case_comments: CaseComment[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ny: { label: 'Ny', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  pagaende: { label: 'Pågående', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  atgardad: { label: 'Åtgärdad', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  godkand: { label: 'Godkänd', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
}

const STATUS_FLOW: Record<string, string> = {
  ny: 'pagaende',
  pagaende: 'atgardad',
  atgardad: 'godkand',
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Låg', color: 'text-gray-500 dark:text-gray-400' },
  medium: { label: 'Medium', color: 'text-blue-500 dark:text-blue-400' },
  high: { label: 'Hög', color: 'text-orange-500 dark:text-orange-400' },
  critical: { label: 'Kritisk', color: 'text-red-500 dark:text-red-400' },
}

export default function CaseDetailPage() {
  const router = useRouter()
  const { id: projectId, caseId } = useParams<{ id: string; caseId: string }>()
  const { tenantId } = useTenant()
  const { role } = useAdmin()

  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const canManage = canManageCases(role)

  useEffect(() => {
    if (!tenantId || !projectId || !caseId) return
    fetchCase()
  }, [tenantId, projectId, caseId])

  async function fetchCase() {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/cases/${caseId}`)
      setCaseData(res.case || res)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdvanceStatus() {
    if (!caseData || !canManage) return
    const nextStatus = STATUS_FLOW[caseData.status]
    if (!nextStatus) return
    setSaving(true)
    try {
      const res = await apiFetch(`/api/projects/${projectId}/cases/${caseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      setCaseData((prev) => prev ? { ...prev, status: nextStatus as Case['status'] } : prev)
      toast.success(`Status uppdaterad till ${STATUS_LABELS[nextStatus].label}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePriorityChange(priority: string) {
    if (!caseData || !canManage) return
    setSaving(true)
    try {
      await apiFetch(`/api/projects/${projectId}/cases/${caseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      })
      setCaseData((prev) => prev ? { ...prev, priority: priority as Case['priority'] } : prev)
      toast.success('Prioritet uppdaterad')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    setSubmittingComment(true)
    try {
      const res = await apiFetch(`/api/projects/${projectId}/cases/${caseId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentBody.trim() }),
      })
      const newComment: CaseComment = res.comment || res
      setCaseData((prev) =>
        prev
          ? { ...prev, case_comments: [...(prev.case_comments || []), newComment] }
          : prev
      )
      setCommentBody('')
      toast.success('Kommentar tillagd')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  if (!tenantId) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
        </main>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <p className="text-gray-500 dark:text-gray-400">Ärendet hittades inte.</p>
        </main>
      </div>
    )
  }

  const statusInfo = STATUS_LABELS[caseData.status] || STATUS_LABELS.ny
  const nextStatus = STATUS_FLOW[caseData.status]
  const photos = Array.isArray(caseData.photos) ? caseData.photos : []
  const comments = Array.isArray(caseData.case_comments) ? caseData.case_comments : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Back link */}
          <button
            onClick={() => router.push(`/projects/${projectId}/cases`)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Tillbaka till ärenden
          </button>

          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white truncate">
                  {caseData.title}
                </h1>
                {caseData.source_type === 'checklist' && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Från egenkontroll</p>
                )}
                {caseData.due_date && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Förfaller: {new Date(caseData.due_date).toLocaleDateString('sv-SE')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                {/* Status badge */}
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>

                {/* Advance status button */}
                {canManage && nextStatus && (
                  <button
                    onClick={handleAdvanceStatus}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-[8px] text-sm font-medium transition-colors"
                  >
                    {saving ? 'Sparar...' : `Nästa steg → ${STATUS_LABELS[nextStatus].label}`}
                  </button>
                )}

                {/* Priority dropdown */}
                {canManage ? (
                  <select
                    value={caseData.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    disabled={saving}
                    className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-[8px] text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`text-sm font-medium ${PRIORITY_LABELS[caseData.priority]?.color || ''}`}>
                    {PRIORITY_LABELS[caseData.priority]?.label || caseData.priority}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
              Beskrivning
            </h2>
            {caseData.description ? (
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {caseData.description}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">Ingen beskrivning</p>
            )}
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
                Bilder
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-[8px] overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Bild ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Kommentarer
            </h2>

            {comments.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 italic text-sm mb-4">Inga kommentarer ännu.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-bold">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Anställd</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(comment.created_at).toLocaleString('sv-SE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment form */}
            <form onSubmit={handleSubmitComment} className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lägg till kommentar
              </label>
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Skriv en kommentar..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-[8px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={submittingComment || !commentBody.trim()}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-[8px] text-sm font-medium transition-colors"
                >
                  {submittingComment ? 'Skickar...' : 'Skicka'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}
