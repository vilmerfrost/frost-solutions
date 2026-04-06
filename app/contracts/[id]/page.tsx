'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { ContractsAPI } from '@/lib/api/contracts'
import { toast } from '@/lib/toast'
import type { Contract, ContractItem, ContractSection } from '@/types/contracts'
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Plus,
  HardHat,
  Users,
  FileSignature,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Format helpers                                                       */
/* ------------------------------------------------------------------ */

function fmt(n: number) {
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(n)
}

/* ------------------------------------------------------------------ */
/* Badges (reused from list page)                                      */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          <FileText className="w-3 h-3" />
          Utkast
        </span>
      )
    case 'sent':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          <Clock className="w-3 h-3" />
          Skickad
        </span>
      )
    case 'signed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" />
          Signerad
        </span>
      )
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          <CheckCircle2 className="w-3 h-3" />
          Aktiv
        </span>
      )
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <CheckCircle2 className="w-3 h-3" />
          Avslutad
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <XCircle className="w-3 h-3" />
          Avbruten
        </span>
      )
    default:
      return null
  }
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'subcontractor') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
        <HardHat className="w-3 h-3" />
        UE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
      <Users className="w-3 h-3" />
      Kund
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { tenantId } = useTenant()

  const [contract, setContract] = useState<Contract | null>(null)
  const [items, setItems] = useState<ContractItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [title, setTitle] = useState('')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [sections, setSections] = useState<ContractSection[]>([])

  // Signing
  const [signatoryEmail, setSignatoryEmail] = useState('')
  const [sending, setSending] = useState(false)

  const fetchContract = useCallback(async () => {
    if (!id) return
    try {
      const data = await ContractsAPI.get(id)
      setContract(data)
      setItems(data.items ?? [])
      setTitle(data.title)
      setCounterpartyName(data.counterparty_name ?? '')
      setStartDate(data.start_date ?? '')
      setEndDate(data.end_date ?? '')
      setDescription(data.description ?? '')
      setSections(data.sections ?? [])
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  const isDraft = contract?.status === 'draft'

  /* ---- Handlers ---- */

  async function handleSave() {
    if (!contract) return
    setSaving(true)
    try {
      const subtotal = items.reduce(
        (sum, i) => sum + (i.line_total ?? i.quantity * i.unit_price),
        0
      )
      const taxAmount = items.reduce(
        (sum, i) => sum + i.quantity * i.unit_price * (i.vat_rate / 100),
        0
      )
      await ContractsAPI.update(contract.id, {
        title,
        description: description || null,
        counterparty_name: counterpartyName || null,
        start_date: startDate || null,
        end_date: endDate || null,
        sections,
        subtotal,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount,
      })
      toast.success('Avtal sparat')
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte spara avtalet')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddItem() {
    if (!contract) return
    try {
      const item = await ContractsAPI.addItem(contract.id, {
        description: 'Ny post',
        item_type: 'labor',
        quantity: 1,
        unit: 'st',
        unit_price: 0,
        vat_rate: 25,
        sort_order: items.length,
      })
      setItems([...items, item])
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte lagga till post')
    }
  }

  function updateItemLocal(itemId: string, field: string, value: any) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i))
  }

  async function handleUpdateItem(item: ContractItem) {
    if (!contract) return
    setItems(prev => prev.map(i => i.id === item.id ? item : i))
    try {
      await ContractsAPI.updateItem(contract.id, item)
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte uppdatera post')
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!contract) return
    try {
      await ContractsAPI.deleteItem(contract.id, itemId)
      setItems(items.filter((i) => i.id !== itemId))
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte ta bort post')
    }
  }

  async function handleSend() {
    if (!contract) return
    if (!signatoryEmail.trim()) {
      toast.error('Ange motpartens e-post')
      return
    }
    setSending(true)
    try {
      await ContractsAPI.send(contract.id, [{ reference: signatoryEmail }])
      toast.success('Avtal skickat for signering!')
      fetchContract()
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte skicka avtalet')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!contract) return
    if (!confirm('Ar du saker?')) return
    try {
      await ContractsAPI.remove(contract.id)
      router.push('/contracts')
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte ta bort avtalet')
    }
  }

  /* ---- Totals ---- */

  const subtotal = items.reduce(
    (sum, i) => sum + (i.line_total ?? i.quantity * i.unit_price),
    0
  )
  const taxAmount = items.reduce(
    (sum, i) => sum + i.quantity * i.unit_price * (i.vat_rate / 100),
    0
  )
  const total = subtotal + taxAmount

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </main>
      </div>
    )
  }

  if (notFound || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Avtal hittades inte</p>
        </main>
      </div>
    )
  }

  const inputCls =
    'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
  const cardCls =
    'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">

          {/* ---- Header ---- */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.push('/contracts')}
                className="mt-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Tillbaka"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {contract.contract_number}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <StatusBadge status={contract.status} />
                  <TypeBadge type={contract.contract_type} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
              <a
                href={ContractsAPI.pdfUrl(id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                PDF
              </a>

              {isDraft && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg text-sm font-semibold shadow-md hover:shadow-xl transition-all disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Spara
                  </button>

                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ta bort
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ---- Signed PDF Banner ---- */}
          {contract.signed_pdf_url && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">Avtal signerat</p>
                <a
                  href={contract.signed_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-700 dark:text-emerald-400 underline"
                >
                  Ladda ner signerat avtal
                </a>
              </div>
            </div>
          )}

          {/* ---- Section 1: Avtalsinformation ---- */}
          <div className={cardCls}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              Avtalsinformation
            </h2>

            {/* Titel */}
            <div className="mb-4">
              <label className={labelCls}>Titel</label>
              {isDraft ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                  placeholder="Avtalsnamn"
                />
              ) : (
                <p className="text-gray-900 dark:text-white text-sm">{contract.title || '—'}</p>
              )}
            </div>

            {/* Motpart + Projekt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Motpart</label>
                {isDraft ? (
                  <input
                    type="text"
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    className={inputCls}
                    placeholder="Foretag eller person"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white text-sm">
                    {contract.counterparty_name || contract.client?.name || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Projekt</label>
                <p className="text-gray-900 dark:text-white text-sm">
                  {contract.project?.name || '—'}
                </p>
              </div>
            </div>

            {/* Startdatum + Slutdatum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Startdatum</label>
                {isDraft ? (
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputCls}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white text-sm">{contract.start_date || '—'}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Slutdatum</label>
                {isDraft ? (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputCls}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white text-sm">{contract.end_date || '—'}</p>
                )}
              </div>
            </div>

            {/* Arbetsbeskrivning */}
            <div>
              <label className={labelCls}>Arbetsbeskrivning</label>
              {isDraft ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={inputCls}
                  placeholder="Beskriv arbetet..."
                />
              ) : (
                <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">
                  {contract.description || '—'}
                </p>
              )}
            </div>
          </div>

          {/* ---- Section 2: Poster (Line Items) ---- */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Poster</h2>
              {isDraft && (
                <button
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg text-sm font-semibold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Lagg till
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 pr-4">Beskrivning</th>
                    <th className="pb-3 pr-4 w-20">Antal</th>
                    <th className="pb-3 pr-4 w-20">Enhet</th>
                    <th className="pb-3 pr-4 w-28">A-pris</th>
                    <th className="pb-3 pr-4 w-28 text-right">Summa</th>
                    {isDraft && <th className="pb-3 w-10" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isDraft ? 6 : 5}
                        className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm"
                      >
                        Inga poster annu
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-4">
                          {isDraft ? (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItemLocal(item.id, 'description', e.target.value)}
                              onBlur={() => handleUpdateItem(item)}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{item.description}</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          {isDraft ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemLocal(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleUpdateItem(item)}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{item.quantity}</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          {isDraft ? (
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateItemLocal(item.id, 'unit', e.target.value)}
                              onBlur={() => handleUpdateItem(item)}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{item.unit}</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          {isDraft ? (
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItemLocal(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleUpdateItem(item)}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">
                              {fmt(item.unit_price)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium text-gray-900 dark:text-white">
                          {fmt(item.line_total ?? item.quantity * item.unit_price)}
                        </td>
                        {isDraft && (
                          <td className="py-2.5">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
                              aria-label="Ta bort post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col items-end gap-1.5 text-sm">
              <div className="flex gap-8 text-gray-600 dark:text-gray-400">
                <span>Netto</span>
                <span className="w-28 text-right font-medium text-gray-900 dark:text-white">
                  {fmtCurrency(subtotal)}
                </span>
              </div>
              <div className="flex gap-8 text-gray-600 dark:text-gray-400">
                <span>Moms</span>
                <span className="w-28 text-right font-medium text-gray-900 dark:text-white">
                  {fmtCurrency(taxAmount)}
                </span>
              </div>
              <div className="flex gap-8 text-gray-700 dark:text-gray-200 font-semibold text-base mt-1">
                <span>Totalt</span>
                <span className="w-28 text-right">{fmtCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* ---- Section 3: Avtalsvillkor (Sections) ---- */}
          {sections.length > 0 && (
            <div className={cardCls}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
                Avtalsvillkor
              </h2>
              <div className="space-y-5">
                {sections.map((section, idx) => (
                  <div key={idx}>
                    <label className={labelCls}>{section.title}</label>
                    {isDraft ? (
                      <textarea
                        value={section.content}
                        onChange={(e) => {
                          const updated = sections.map((s, i) =>
                            i === idx ? { ...s, content: e.target.value } : s
                          )
                          setSections(updated)
                        }}
                        rows={4}
                        className={inputCls}
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">
                        {section.content || '—'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- Section 4: Signering (draft only) ---- */}
          {isDraft && (
            <div className={cardCls}>
              <div className="flex items-center gap-2 mb-5">
                <FileSignature className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Signering</h2>
              </div>

              <div className="mb-4">
                <label className={labelCls}>Motpartens e-post</label>
                <input
                  type="email"
                  value={signatoryEmail}
                  onChange={(e) => setSignatoryEmail(e.target.value)}
                  className={inputCls}
                  placeholder="motpart@foretag.se"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={sending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-md hover:shadow-xl transition-all disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Skicka for signering
              </button>

              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Motparten signerar digitalt via BankID / Criipto. En lanklk skickas till angiven e-postadress.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
