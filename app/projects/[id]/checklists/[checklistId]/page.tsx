'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import { canSignOffChecklist } from '@/lib/binders/permissions'
import { compressImage } from '@/lib/photos/compress'
import Sidebar from '@/components/Sidebar'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ItemType = 'yes_no' | 'measurement' | 'dropdown' | 'text'
type ItemStatus = 'pending' | 'ok' | 'fail' | 'na'

interface ChecklistItem {
  id: string
  section: string
  sort_order: number
  label: string
  item_type: ItemType
  config: {
    unit?: string
    options?: string[]
  }
  value: string | null
  status: ItemStatus
  comment: string | null
  photo_path: string | null
  case_id: string | null
}

interface Checklist {
  id: string
  name: string
  status: 'draft' | 'in_progress' | 'completed' | 'signed_off'
  assigned_to: string | null
  template_id: string | null
  signed_by: string | null
  signed_at: string | null
  signature_data: string | null
  created_at: string
  updated_at: string
  checklist_items: ChecklistItem[]
}

interface DraftData {
  items: Record<string, { value: string | null; status: ItemStatus; comment: string | null }>
  savedAt: string
}

/* ------------------------------------------------------------------ */
/*  Draft persistence helpers                                          */
/* ------------------------------------------------------------------ */

function getDraftKey(checklistId: string) {
  return `checklist-draft-${checklistId}`
}

function loadDraft(checklistId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(getDraftKey(checklistId))
    if (!raw) return null
    return JSON.parse(raw) as DraftData
  } catch {
    return null
  }
}

function saveDraft(checklistId: string, data: DraftData) {
  try {
    localStorage.setItem(getDraftKey(checklistId), JSON.stringify(data))
  } catch {
    // localStorage may be unavailable
  }
}

function clearDraft(checklistId: string) {
  try {
    localStorage.removeItem(getDraftKey(checklistId))
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/*  Signature Pad Component                                            */
/* ------------------------------------------------------------------ */

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    function start(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      drawing.current = true
      lastPos.current = getPos(e, canvas!)
    }

    function move(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      if (!drawing.current || !lastPos.current || !ctx) return
      const pos = getPos(e, canvas!)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPos.current = pos
    }

    function end() {
      drawing.current = false
      lastPos.current = null
    }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', end)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', end)
    }
  }, [])

  function handleClear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-[8px] w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Signatur</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rita din signatur nedan</p>
        </div>
        <div className="p-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={180}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-[8px] bg-white touch-none"
            style={{ touchAction: 'none' }}
          />
        </div>
        <div className="p-4 flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 py-3 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-[8px] hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Rensa
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-[8px] hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-[8px] font-medium"
          >
            Spara
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Failed item prompt                                                 */
/* ------------------------------------------------------------------ */

interface FailPromptProps {
  itemLabel: string
  onConfirm: () => void
  onCancel: () => void
}

function FailPrompt({ itemLabel, onConfirm, onCancel }: FailPromptProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-[8px] w-full max-w-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 text-xl flex-shrink-0">
            !
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Skapa ärende?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{itemLabel}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Vill du skapa ett ärende för denna punkt som behöver åtgärdas?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-[8px] hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Nej tack
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-sm text-white bg-red-500 hover:bg-red-600 rounded-[8px] font-medium"
          >
            Skapa ärende
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Single checklist item card                                         */
/* ------------------------------------------------------------------ */

interface ItemCardProps {
  item: ChecklistItem
  draftValues: DraftData['items']
  onUpdate: (itemId: string, patch: Partial<{ value: string | null; status: ItemStatus; comment: string | null }>) => void
  onPhotoCapture: (itemId: string, file: File) => void
  onNejPressed: (item: ChecklistItem) => void
}

function ItemCard({ item, draftValues, onUpdate, onPhotoCapture, onNejPressed }: ItemCardProps) {
  const [showComment, setShowComment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const draft = draftValues[item.id]
  const currentValue = draft?.value ?? item.value
  const currentStatus = draft?.status ?? item.status
  const currentComment = draft?.comment ?? item.comment

  function handleYesNo(status: ItemStatus) {
    if (status === 'fail') {
      onNejPressed(item)
    } else {
      onUpdate(item.id, { status, value: status === 'ok' ? 'yes' : status === 'na' ? 'na' : null })
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onPhotoCapture(item.id, file)
    // reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const yesNoButtons: Array<{ label: string; status: ItemStatus; activeClass: string; inactiveClass: string }> = [
    {
      label: 'Ja',
      status: 'ok',
      activeClass: 'bg-green-500 text-white border-green-500',
      inactiveClass: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20',
    },
    {
      label: 'Nej',
      status: 'fail',
      activeClass: 'bg-red-500 text-white border-red-500',
      inactiveClass: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
    {
      label: 'Ej tillämpligt',
      status: 'na',
      activeClass: 'bg-gray-500 text-white border-gray-500',
      inactiveClass: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600',
    },
  ]

  const hasCaseCreated = !!item.case_id
  const hasPhoto = !!item.photo_path

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Item header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug flex-1">
            {item.label}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasCaseCreated && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                Ärende
              </span>
            )}
            {hasPhoto && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Foto
              </span>
            )}
            {currentStatus !== 'pending' && (
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                currentStatus === 'ok' ? 'bg-green-500' :
                currentStatus === 'fail' ? 'bg-red-500' :
                currentStatus === 'na' ? 'bg-gray-400' : 'bg-gray-300'
              }`} />
            )}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 pb-3">
        {item.item_type === 'yes_no' && (
          <div className="grid grid-cols-3 gap-2">
            {yesNoButtons.map(({ label, status, activeClass, inactiveClass }) => (
              <button
                key={status}
                onClick={() => handleYesNo(status)}
                className={`min-h-[48px] py-3 px-2 text-sm font-medium rounded-[8px] border-2 transition-all ${
                  currentStatus === status ? activeClass : inactiveClass
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {item.item_type === 'measurement' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={currentValue ?? ''}
              onChange={(e) => onUpdate(item.id, { value: e.target.value || null, status: e.target.value ? 'ok' : 'pending' })}
              placeholder="0"
              className="flex-1 min-h-[48px] text-lg text-center font-mono bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-[8px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {item.config.unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium min-w-[2rem]">
                {item.config.unit}
              </span>
            )}
          </div>
        )}

        {item.item_type === 'dropdown' && (
          <select
            value={currentValue ?? ''}
            onChange={(e) => onUpdate(item.id, { value: e.target.value || null, status: e.target.value ? 'ok' : 'pending' })}
            className="w-full min-h-[48px] px-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-[8px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="">Välj alternativ...</option>
            {(item.config.options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}

        {item.item_type === 'text' && (
          <textarea
            value={currentValue ?? ''}
            onChange={(e) => onUpdate(item.id, { value: e.target.value || null, status: e.target.value ? 'ok' : 'pending' })}
            placeholder="Ange svar..."
            rows={2}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-[8px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
          />
        )}
      </div>

      {/* Comment + Camera row */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <button
          onClick={() => setShowComment((v) => !v)}
          className={`flex items-center gap-1.5 text-xs py-2 px-3 rounded-[8px] border transition-colors ${
            showComment || currentComment
              ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Kommentar
        </button>

        {/* Camera button */}
        <label className={`flex items-center gap-1.5 text-xs py-2 px-3 rounded-[8px] border cursor-pointer transition-colors ${
          hasPhoto
            ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Foto
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handlePhotoChange}
          />
        </label>
      </div>

      {/* Comment textarea (collapsed by default) */}
      {(showComment || currentComment) && (
        <div className="px-4 pb-4">
          <textarea
            value={currentComment ?? ''}
            onChange={(e) => onUpdate(item.id, { comment: e.target.value || null })}
            placeholder="Lägg till kommentar..."
            rows={2}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-[8px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
          />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ChecklistFillPage() {
  const router = useRouter()
  const { id: projectId, checklistId } = useParams<{ id: string; checklistId: string }>()
  const { tenantId } = useTenant()
  const { role } = useAdmin()

  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Grouped sections
  const [sections, setSections] = useState<string[]>([])
  const [activeSection, setActiveSection] = useState(0)

  // Draft: keyed by item id
  const [draftValues, setDraftValues] = useState<DraftData['items']>({})

  // Uploading photo item id
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)

  // Pending "Nej" prompt
  const [pendingFailItem, setPendingFailItem] = useState<ChecklistItem | null>(null)

  // Sign-off pad
  const [showSignPad, setShowSignPad] = useState(false)

  const canSign = canSignOffChecklist(role)

  /* ---- Fetch checklist ---- */
  useEffect(() => {
    if (!tenantId || !projectId || !checklistId) return
    fetchChecklist()
  }, [tenantId, projectId, checklistId])

  async function fetchChecklist() {
    try {
      const res = await apiFetch<{ checklist: Checklist }>(
        `/api/projects/${projectId}/checklists/${checklistId}`
      )
      const cl = res.checklist
      setChecklist(cl)

      // Build sections
      const seen = new Set<string>()
      const sectionList: string[] = []
      for (const item of cl.checklist_items) {
        if (!seen.has(item.section)) {
          seen.add(item.section)
          sectionList.push(item.section)
        }
      }
      setSections(sectionList)

      // Restore draft
      const draft = loadDraft(checklistId)
      if (draft) {
        setDraftValues(draft.items)
        toast.info('Utkast återställt')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ---- Update a single item in draft ---- */
  const handleUpdate = useCallback((
    itemId: string,
    patch: Partial<{ value: string | null; status: ItemStatus; comment: string | null }>
  ) => {
    setDraftValues((prev) => {
      const existing = prev[itemId] ?? { value: null, status: 'pending' as ItemStatus, comment: null }
      const updated = { ...existing, ...patch }
      const next = { ...prev, [itemId]: updated }
      // Persist to localStorage
      saveDraft(checklistId, { items: next, savedAt: new Date().toISOString() })
      return next
    })
  }, [checklistId])

  /* ---- Photo capture ---- */
  async function handlePhotoCapture(itemId: string, file: File) {
    setUploadingItemId(itemId)
    try {
      const compressed = await compressImage(file)

      // Upload via FormData to a generic upload endpoint or handle as base64
      const formData = new FormData()
      formData.append('file', compressed)
      formData.append('path', `checklists/${checklistId}/${itemId}`)

      const uploadRes = await fetch(`/api/storage/upload`, {
        method: 'POST',
        body: formData,
      })

      let photoPath: string
      if (uploadRes.ok) {
        const data = await uploadRes.json()
        photoPath = data.path ?? data.url ?? `checklists/${checklistId}/${itemId}/${compressed.name}`
      } else {
        // Fallback: store as a placeholder path
        photoPath = `checklists/${checklistId}/${itemId}/${compressed.name}`
      }

      // Immediately PATCH the item
      await apiFetch(`/api/projects/${projectId}/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ photoPath }),
      })

      // Update local checklist item
      setChecklist((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          checklist_items: prev.checklist_items.map((it) =>
            it.id === itemId ? { ...it, photo_path: photoPath } : it
          ),
        }
      })
      toast.success('Foto sparat')
    } catch (err: any) {
      toast.error('Kunde inte ladda upp foto')
    } finally {
      setUploadingItemId(null)
    }
  }

  /* ---- Nej pressed — show prompt ---- */
  function handleNejPressed(item: ChecklistItem) {
    // First update draft to fail
    handleUpdate(item.id, { status: 'fail', value: 'no' })
    // Then show prompt
    setPendingFailItem(item)
  }

  /* ---- Confirm case creation ---- */
  async function handleConfirmCase() {
    if (!pendingFailItem) return
    const itemId = pendingFailItem.id
    setPendingFailItem(null)
    try {
      await apiFetch(`/api/projects/${projectId}/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'fail', value: 'no', createCase: true }),
      })
      // Update case_id in local state
      setChecklist((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          checklist_items: prev.checklist_items.map((it) =>
            it.id === itemId ? { ...it, status: 'fail', value: 'no', case_id: 'created' } : it
          ),
        }
      })
      toast.success('Ärende skapat')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  /* ---- Save draft to server ---- */
  async function handleSaveDraft() {
    if (!checklist) return
    setSaving(true)
    try {
      const items = checklist.checklist_items
      const patches = items.map(async (item) => {
        const d = draftValues[item.id]
        if (!d) return
        await apiFetch(`/api/projects/${projectId}/checklists/${checklistId}/items/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            value: d.value,
            status: d.status,
            comment: d.comment,
          }),
        })
      })
      await Promise.allSettled(patches)

      // Ensure checklist is in_progress
      if (checklist.status === 'draft') {
        await apiFetch(`/api/projects/${projectId}/checklists/${checklistId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        })
        setChecklist((prev) => prev ? { ...prev, status: 'in_progress' } : prev)
      }

      clearDraft(checklistId)
      toast.success('Utkast sparat')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  /* ---- Complete checklist ---- */
  async function handleComplete() {
    if (!checklist) return
    setCompleting(true)
    try {
      // First save all items
      const patches = checklist.checklist_items.map(async (item) => {
        const d = draftValues[item.id]
        if (!d) return
        await apiFetch(`/api/projects/${projectId}/checklists/${checklistId}/items/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            value: d.value,
            status: d.status,
            comment: d.comment,
          }),
        })
      })
      await Promise.allSettled(patches)

      // Mark completed
      await apiFetch(`/api/projects/${projectId}/checklists/${checklistId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      })
      setChecklist((prev) => prev ? { ...prev, status: 'completed' } : prev)
      clearDraft(checklistId)

      if (canSign) {
        setShowSignPad(true)
      } else {
        toast.success('Egenkontroll slutförd')
        router.push(`/projects/${projectId}/checklists`)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCompleting(false)
    }
  }

  /* ---- Sign off ---- */
  async function handleSignOff(signatureData: string) {
    setShowSignPad(false)
    try {
      await apiFetch(`/api/projects/${projectId}/checklists/${checklistId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'signed_off', signatureData }),
      })
      toast.success('Egenkontroll signerad')
      router.push(`/projects/${projectId}/checklists`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  /* ---- Derived data ---- */
  const allItems = checklist?.checklist_items ?? []

  const sectionItems = sections[activeSection]
    ? allItems.filter((it) => it.section === sections[activeSection])
    : []

  const answeredCount = allItems.filter((it) => {
    const d = draftValues[it.id]
    const status = d?.status ?? it.status
    return status !== 'pending'
  }).length

  const allAnswered = answeredCount >= allItems.length && allItems.length > 0

  /* ---- Loading state ---- */
  if (!tenantId) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
        </main>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Egenkontroll hittades inte</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />

      <main className="flex-1 flex flex-col pb-28">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => router.push(`/projects/${projectId}/checklists`)}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-[8px]"
            aria-label="Tillbaka"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {checklist.name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sections.length > 0 && `Sektion ${activeSection + 1} av ${sections.length}`}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
            checklist.status === 'signed_off'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : checklist.status === 'completed'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : checklist.status === 'in_progress'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {checklist.status === 'signed_off' ? 'Signerad' :
             checklist.status === 'completed' ? 'Klar' :
             checklist.status === 'in_progress' ? 'Pågående' : 'Utkast'}
          </span>
        </div>

        {/* Section navigation */}
        {sections.length > 1 && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {sections.map((sec, idx) => {
              const sItems = allItems.filter((it) => it.section === sec)
              const sAnswered = sItems.filter((it) => {
                const d = draftValues[it.id]
                return (d?.status ?? it.status) !== 'pending'
              }).length
              const sDone = sAnswered >= sItems.length
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(idx)}
                  className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                    activeSection === idx
                      ? 'bg-primary-500 text-white'
                      : sDone
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {sDone && activeSection !== idx && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {sec}
                </button>
              )
            })}
          </div>
        )}

        {/* Section header */}
        {sections[activeSection] && (
          <div className="px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {sections[activeSection]}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {sectionItems.filter((it) => (draftValues[it.id]?.status ?? it.status) !== 'pending').length} av {sectionItems.length} svarade
            </p>
          </div>
        )}

        {/* Items */}
        <div className="px-4 space-y-3 flex-1">
          {sectionItems.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
              Inga kontrollpunkter i denna sektion
            </div>
          )}
          {sectionItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              draftValues={draftValues}
              onUpdate={handleUpdate}
              onPhotoCapture={handlePhotoCapture}
              onNejPressed={handleNejPressed}
            />
          ))}
        </div>

        {/* Prev / Next section navigation */}
        {sections.length > 1 && (
          <div className="px-4 pt-4 flex gap-3">
            {activeSection > 0 && (
              <button
                onClick={() => setActiveSection((i) => i - 1)}
                className="flex-1 py-3 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[8px] hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Föregående
              </button>
            )}
            {activeSection < sections.length - 1 && (
              <button
                onClick={() => setActiveSection((i) => i + 1)}
                className="flex-1 py-3 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-[8px] font-medium"
              >
                Nästa
              </button>
            )}
          </div>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {answeredCount} av {allItems.length} kontrollpunkter
          </span>
          {uploadingItemId && (
            <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Laddar upp...
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-[8px] transition-colors disabled:opacity-50"
          >
            {saving ? 'Sparar...' : 'Spara utkast'}
          </button>
          <button
            onClick={handleComplete}
            disabled={completing || !allAnswered}
            className={`flex-1 py-3 text-sm font-medium rounded-[8px] transition-colors ${
              allAnswered
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {completing ? 'Slutför...' : 'Slutför'}
          </button>
        </div>
      </div>

      {/* Failed item prompt */}
      {pendingFailItem && (
        <FailPrompt
          itemLabel={pendingFailItem.label}
          onConfirm={handleConfirmCase}
          onCancel={() => setPendingFailItem(null)}
        />
      )}

      {/* Signature pad */}
      {showSignPad && (
        <SignaturePad
          onSave={handleSignOff}
          onCancel={() => {
            setShowSignPad(false)
            toast.info('Signering avbruten — egenkontroll markerad som klar')
            router.push(`/projects/${projectId}/checklists`)
          }}
        />
      )}
    </div>
  )
}
