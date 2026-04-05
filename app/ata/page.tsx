'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import Sidebar from '@/components/Sidebar'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Project {
  id: string
  name: string
}

interface AtaItem {
  id: string
  project_id: string | null
  description: string
  ata_type: 'foreseen' | 'unforeseen' | null
  urgency: 'normal' | 'urgent' | 'critical' | null
  cost_frame: number | null
  labor_hours: number | null
  labor_rate_sek: number | null
  customer_approval_status: string | null
  signing_order_id: string | null
  status_timeline: { status: string; timestamp: string; user_id?: string }[]
  created_at: string
  projects?: { name: string } | null
}

interface AuditEvent {
  id: string
  event_type: string
  actor_id: string
  data: Record<string, unknown>
  created_at: string
  event_hash: string | null
}

interface ChainVerification {
  valid: boolean
  events: number
  brokenAt?: string
  message?: string
}

/* ------------------------------------------------------------------ */
/*  Pipeline config                                                    */
/* ------------------------------------------------------------------ */

const COLUMNS = [
  { key: 'created',          label: 'Skapad',        color: 'amber' },
  { key: 'admin_reviewed',   label: 'Granskad',      color: 'blue' },
  { key: 'approval_sent',    label: 'Väntar kund',   color: 'purple' },
  { key: 'customer_approved',label: 'Godkänd',       color: 'green' },
  { key: 'invoice_generated',label: 'Fakturerad',    color: 'emerald' },
] as const

type ColumnKey = typeof COLUMNS[number]['key']

const colStyles: Record<string, { header: string; badge: string; border: string }> = {
  amber:   { header: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',   badge: 'bg-amber-500',   border: 'border-l-amber-500' },
  blue:    { header: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',       badge: 'bg-blue-500',    border: 'border-l-blue-500' },
  purple:  { header: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', badge: 'bg-purple-500', border: 'border-l-purple-500' },
  green:   { header: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',   badge: 'bg-green-500',   border: 'border-l-green-500' },
  emerald: { header: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', badge: 'bg-emerald-500', border: 'border-l-emerald-500' },
}

function currentStatus(item: AtaItem): string {
  const tl = item.status_timeline
  if (!tl || tl.length === 0) return 'created'
  return tl[tl.length - 1].status
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m sedan`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h sedan`
  const days = Math.floor(hours / 24)
  return `${days}d sedan`
}

function sek(n: number) {
  return Number(n ?? 0).toLocaleString('sv-SE') + ' kr'
}

const eventLabels: Record<string, string> = {
  created: 'ÄTA skapad',
  photos_added: 'Foton tillagda',
  admin_reviewed: 'Granskad av admin',
  pricing_set: 'Prissättning satt',
  approval_sent: 'Skickad till kund',
  customer_approved: 'Godkänd av kund',
  customer_rejected: 'Nekad av kund',
  invoice_generated: 'Faktura genererad',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AtaKanbanPage() {
  const { tenantId } = useTenant()

  const [items, setItems] = useState<AtaItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('all')

  // Detail panel
  const [selected, setSelected] = useState<AtaItem | null>(null)
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([])
  const [chainValid, setChainValid] = useState<ChainVerification | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // New ÄTA modal
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({
    project_id: '',
    description: '',
    ata_type: 'foreseen' as 'foreseen' | 'unforeseen',
    urgency: 'normal' as 'normal' | 'urgent' | 'critical',
    photos: [] as string[],
  })
  const [creating, setCreating] = useState(false)

  /* ---------- load data ---------- */

  const loadData = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      // Load ÄTA items via API
      const params = new URLSearchParams()
      if (projectFilter !== 'all') params.set('project_id', projectFilter)
      const ataRes = await apiFetch<{ data: AtaItem[] }>(`/api/ata/v2/list?${params.toString()}`)
      setItems(ataRes.data || [])

      // Load projects for filter dropdown
      const projRes = await apiFetch<{ projects?: Project[] }>(`/api/projects/list?tenantId=${tenantId}`)
      setProjects(projRes.projects || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda ÄTA-ärenden')
    } finally {
      setLoading(false)
    }
  }, [tenantId, projectFilter])

  useEffect(() => { loadData() }, [loadData])

  /* ---------- detail panel ---------- */

  async function openDetail(item: AtaItem) {
    setSelected(item)
    setAuditTrail([])
    setChainValid(null)
    try {
      const [trailRes, chainRes] = await Promise.allSettled([
        apiFetch<{ success: boolean; data: AuditEvent[] }>(`/api/ata/v2/${item.id}/documents`),
        apiFetch<{ success: boolean; data: ChainVerification }>(`/api/ata/v2/${item.id}/verify-chain`),
      ])
      if (trailRes.status === 'fulfilled') setAuditTrail(trailRes.value.data || [])
      if (chainRes.status === 'fulfilled') setChainValid(chainRes.value.data)
    } catch {
      // non-critical
    }
  }

  /* ---------- actions ---------- */

  async function doAction(endpoint: string, body?: Record<string, unknown>) {
    if (!selected) return
    setActionLoading(true)
    try {
      await apiFetch(`/api/ata/v2/${selected.id}/${endpoint}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      })
      await loadData()
      setSelected(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setActionLoading(false)
    }
  }

  /* ---------- create ---------- */

  async function handleCreate() {
    setCreating(true)
    try {
      await apiFetch('/api/ata/v2/create', {
        method: 'POST',
        body: JSON.stringify({
          project_id: newForm.project_id,
          description: newForm.description,
          ata_type: newForm.ata_type,
          urgency: newForm.urgency,
          photos: newForm.photos.length > 0 ? newForm.photos : undefined,
        }),
      })
      setShowNew(false)
      setNewForm({ project_id: '', description: '', ata_type: 'foreseen', urgency: 'normal', photos: [] })
      await loadData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Kunde inte skapa ÄTA')
    } finally {
      setCreating(false)
    }
  }

  /* ---------- bucket items ---------- */

  const buckets: Record<ColumnKey, AtaItem[]> = {
    created: [],
    admin_reviewed: [],
    approval_sent: [],
    customer_approved: [],
    invoice_generated: [],
  }

  for (const item of items) {
    const s = currentStatus(item)
    if (s in buckets) {
      buckets[s as ColumnKey].push(item)
    } else {
      buckets.created.push(item)
    }
  }

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 dark:text-white">
                ÄTA-ärenden
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Hantera ändrings- och tilläggsarbeten genom hela livscykeln
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Project filter */}
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm"
              >
                <option value="all">Alla projekt</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => { setShowNew(true); if (projects.length > 0 && !newForm.project_id) setNewForm(f => ({ ...f, project_id: projects[0].id })) }}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900 px-5 py-2.5 rounded-lg font-bold shadow-md hover:shadow-xl transition-all text-sm whitespace-nowrap"
              >
                + Ny ÄTA
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 text-center text-stone-500 dark:text-stone-400 py-12">
              <p className="mb-3">{error}</p>
              <button onClick={loadData} className="text-amber-600 hover:underline font-medium">
                Försök igen
              </button>
            </div>
          )}

          {/* Kanban */}
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((c) => (
                <div key={c.key} className="min-w-[280px] flex-1">
                  <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse mb-3" />
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-32 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((col) => {
                const style = colStyles[col.color]
                const colItems = buckets[col.key]
                return (
                  <div key={col.key} className="min-w-[280px] flex-1">
                    {/* Column header */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 ${style.header}`}>
                      <span className="text-sm font-semibold">{col.label}</span>
                      <span className={`${style.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                        {colItems.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      {colItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => openDetail(item)}
                          className={`w-full text-left bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 p-4 hover:shadow-md transition-all border-l-4 ${style.border}`}
                        >
                          <p className="font-bold text-stone-900 dark:text-white text-sm mb-1 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              item.ata_type === 'unforeseen'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300'
                            }`}>
                              {item.ata_type === 'unforeseen' ? 'Oförutsedd' : 'Förutsedd'}
                            </span>
                            {item.urgency && item.urgency !== 'normal' && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                {item.urgency === 'critical' ? 'Kritisk' : 'Brådskande'}
                              </span>
                            )}
                          </div>
                          {item.cost_frame != null && (
                            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
                              {sek(item.cost_frame)}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500">
                            <span>{item.projects?.name || 'Inget projekt'}</span>
                            <span>{timeAgo(item.created_at)}</span>
                          </div>
                        </button>
                      ))}
                      {colItems.length === 0 && (
                        <div className="text-center py-8 text-stone-400 dark:text-stone-500 text-xs">
                          Inga ärenden
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ---------- Detail slide-out panel ---------- */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-stone-800 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Close */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">ÄTA-detaljer</h2>
                <button onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-2xl leading-none">&times;</button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-1">Beskrivning</h3>
                <p className="text-stone-900 dark:text-white">{selected.description}</p>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">Typ</span>
                  <p className="font-semibold text-stone-900 dark:text-white text-sm">
                    {selected.ata_type === 'unforeseen' ? 'Oförutsedd' : 'Förutsedd'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">Brådskande</span>
                  <p className="font-semibold text-stone-900 dark:text-white text-sm capitalize">
                    {selected.urgency === 'critical' ? 'Kritisk' : selected.urgency === 'urgent' ? 'Brådskande' : 'Normal'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">Projekt</span>
                  <p className="font-semibold text-stone-900 dark:text-white text-sm">
                    {selected.projects?.name || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">Status</span>
                  <p className="font-semibold text-stone-900 dark:text-white text-sm">
                    {COLUMNS.find(c => c.key === currentStatus(selected))?.label || currentStatus(selected)}
                  </p>
                </div>
              </div>

              {/* Pricing breakdown */}
              {(selected.labor_hours != null || selected.cost_frame != null) && (
                <div className="mb-6 bg-stone-50 dark:bg-stone-900 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3">Prissättning</h3>
                  {selected.labor_hours != null && selected.labor_rate_sek != null && (
                    <>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone-600 dark:text-stone-300">Arbetstimmar</span>
                        <span className="text-stone-900 dark:text-white">{selected.labor_hours}h &times; {sek(selected.labor_rate_sek)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone-600 dark:text-stone-300">Arbetskostnad</span>
                        <span className="text-stone-900 dark:text-white">{sek(selected.labor_hours * selected.labor_rate_sek)}</span>
                      </div>
                      {selected.cost_frame != null && (
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-stone-600 dark:text-stone-300">Materialkostnad</span>
                          <span className="text-stone-900 dark:text-white">
                            {sek(selected.cost_frame - selected.labor_hours * selected.labor_rate_sek)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {selected.cost_frame != null && (
                    <div className="flex justify-between text-sm font-bold border-t border-stone-200 dark:border-stone-700 pt-2 mt-2">
                      <span className="text-stone-900 dark:text-white">Totalt</span>
                      <span className="text-stone-900 dark:text-white">{sek(selected.cost_frame)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* BankID status */}
              {selected.signing_order_id && (
                <div className="mb-6 flex items-center gap-2 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-stone-600 dark:text-stone-300">BankID-signering aktiv</span>
                </div>
              )}

              {/* Actions */}
              <div className="mb-6 space-y-2">
                {currentStatus(selected) === 'created' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      const hours = prompt('Arbetstimmar:')
                      const rate = prompt('Timpris (SEK):')
                      const material = prompt('Materialkostnad (SEK):')
                      if (hours && rate && material) {
                        doAction('review', {
                          labor_hours: Number(hours),
                          labor_rate_sek: Number(rate),
                          material_cost_sek: Number(material),
                        })
                      }
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-all text-sm disabled:opacity-50"
                  >
                    Granska
                  </button>
                )}
                {currentStatus(selected) === 'admin_reviewed' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => doAction('send-approval', { use_bankid: false })}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-all text-sm disabled:opacity-50"
                  >
                    Skicka till kund
                  </button>
                )}
                {currentStatus(selected) === 'approval_sent' && (
                  <div className="text-center py-3 text-purple-600 dark:text-purple-400 text-sm font-medium">
                    Väntar på kundens svar...
                  </div>
                )}
                {currentStatus(selected) === 'customer_approved' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => doAction('generate-invoice')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-all text-sm disabled:opacity-50"
                  >
                    Generera faktura
                  </button>
                )}
              </div>

              {/* Audit trail */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400">Spårbarhet</h3>
                  {chainValid && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      chainValid.valid
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {chainValid.valid ? 'Kedja verifierad' : 'Kedja bruten'}
                    </span>
                  )}
                </div>
                {auditTrail.length > 0 ? (
                  <div className="relative pl-5 border-l-2 border-stone-200 dark:border-stone-700 space-y-4">
                    {auditTrail.map((event) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-[1.4rem] top-1 w-3 h-3 rounded-full bg-stone-300 dark:bg-stone-600 border-2 border-white dark:border-stone-800" />
                        <div className="text-sm">
                          <span className="font-semibold text-stone-900 dark:text-white">
                            {eventLabels[event.event_type] || event.event_type}
                          </span>
                          {event.event_hash && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400" title={event.event_hash}>
                              #verifierad
                            </span>
                          )}
                          <p className="text-xs text-stone-400 dark:text-stone-500">
                            {new Date(event.created_at).toLocaleString('sv-SE')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400 dark:text-stone-500">Laddar spårbarhet...</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------- New ÄTA modal ---------- */}
      {showNew && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowNew(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Ny ÄTA</h2>
                <button onClick={() => setShowNew(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-2xl leading-none">&times;</button>
              </div>

              <div className="space-y-4">
                {/* Project */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">Projekt</label>
                  <select
                    value={newForm.project_id}
                    onChange={(e) => setNewForm(f => ({ ...f, project_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
                  >
                    <option value="">Välj projekt...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">Beskrivning</label>
                  <textarea
                    rows={3}
                    value={newForm.description}
                    onChange={(e) => setNewForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm resize-none"
                    placeholder="Beskriv ändringen..."
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">Typ</label>
                  <div className="flex gap-4">
                    {(['foreseen', 'unforeseen'] as const).map((t) => (
                      <label key={t} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
                        <input
                          type="radio"
                          name="ata_type"
                          checked={newForm.ata_type === t}
                          onChange={() => setNewForm(f => ({ ...f, ata_type: t }))}
                          className="accent-amber-500"
                        />
                        {t === 'foreseen' ? 'Förutsedd' : 'Oförutsedd'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">Brådskande</label>
                  <div className="flex gap-4">
                    {(['normal', 'urgent', 'critical'] as const).map((u) => (
                      <label key={u} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
                        <input
                          type="radio"
                          name="urgency"
                          checked={newForm.urgency === u}
                          onChange={() => setNewForm(f => ({ ...f, urgency: u }))}
                          className="accent-amber-500"
                        />
                        {u === 'normal' ? 'Normal' : u === 'urgent' ? 'Brådskande' : 'Kritisk'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Photos (URL input for now) */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Foton (URL){newForm.ata_type === 'unforeseen' && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Klistra in bild-URL och tryck Enter"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val) {
                          setNewForm(f => ({ ...f, photos: [...f.photos, val] }))
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                  {newForm.photos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {newForm.photos.map((url, i) => (
                        <span key={i} className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          Foto {i + 1}
                          <button onClick={() => setNewForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))} className="text-stone-400 hover:text-red-500">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowNew(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition-all"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newForm.project_id || !newForm.description || (newForm.ata_type === 'unforeseen' && newForm.photos.length === 0)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900 px-4 py-2.5 rounded-lg font-bold transition-all text-sm disabled:opacity-50"
                >
                  {creating ? 'Skapar...' : 'Skapa ÄTA'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
