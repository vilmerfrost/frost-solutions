'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { ContractsAPI } from '@/lib/api/contracts'
import { CONTRACT_TEMPLATES } from '@/lib/ata/contract-templates'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import type { ContractType, ContractSection } from '@/types/contracts'
import {
  Scale,
  HardHat,
  Home,
  FileText,
  Users,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface ProjectOption {
  id: string
  name: string
}

interface ClientOption {
  id: string
  name: string
  email?: string
}

interface LineItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  item_type: 'labor' | 'material' | 'other'
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const TEMPLATE_ICON_MAP: Record<string, React.ElementType> = {
  ab04: Scale,
  abt06: HardHat,
  consumer: Home,
  'simple-client': Users,
  subcontractor: HardHat,
}

const CLIENT_TEMPLATE_IDS = ['ab04', 'abt06', 'consumer', 'simple-client']
const SUBCONTRACTOR_TEMPLATE_IDS = ['subcontractor', 'ab04', 'abt06']

const VAT_RATE = 0.25

function calcLineTotals(items: LineItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const taxAmount = subtotal * VAT_RATE
  const totalAmount = subtotal + taxAmount
  return { subtotal, taxAmount, totalAmount }
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function NewContractPage() {
  const router = useRouter()
  const { tenantId } = useTenant()

  // Step 1 — Contract type
  const [contractType, setContractType] = useState<ContractType | null>(null)

  // Step 2 — Template
  const [templateId, setTemplateId] = useState<string | null>(null)

  // Step 3 — Details
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [clientId, setClientId] = useState('')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  // Step 4 — Line items
  const [items, setItems] = useState<LineItem[]>([])

  // Step 5 — Sections (from template)
  const [sections, setSections] = useState<ContractSection[]>([])

  // Dropdown data
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])

  // UI state
  const [saving, setSaving] = useState(false)

  /* ---------------------------------------------------------------- */
  /* Data fetching                                                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!tenantId) return
    apiFetch<{ projects?: ProjectOption[] }>(`/api/projects/list?tenantId=${tenantId}`)
      .then(r => setProjects(r.projects ?? []))
      .catch(() => {})
    apiFetch<{ data?: ClientOption[] }>('/api/clients?limit=100')
      .then(r => setClients(r.data ?? []))
      .catch(() => {})
  }, [tenantId])

  /* ---------------------------------------------------------------- */
  /* Handlers                                                          */
  /* ---------------------------------------------------------------- */

  function handleSelectType(type: ContractType) {
    setContractType(type)
    setTemplateId(null)
    setSections([])
  }

  function handleSelectTemplate(id: string) {
    if (templateId === id) {
      setTemplateId(null)
      setSections([])
      return
    }
    setTemplateId(id)
    const tpl = CONTRACT_TEMPLATES.find(t => t.id === id)
    if (tpl) {
      setSections(tpl.sections.map(s => ({ title: s.title, content: s.content })))
    }
  }

  function handleClientChange(id: string) {
    setClientId(id)
    const found = clients.find(c => c.id === id)
    if (found) setCounterpartyName(found.name)
  }

  function addItem() {
    setItems(prev => [
      ...prev,
      { description: '', quantity: 1, unit: 'st', unit_price: 0, item_type: 'labor' },
    ])
  }

  function updateItem<K extends keyof LineItem>(idx: number, key: K, value: LineItem[K]) {
    setItems(prev => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)))
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateSection(idx: number, content: string) {
    setSections(prev => prev.map((s, i) => (i === idx ? { ...s, content } : s)))
  }

  async function handleSave() {
    if (!contractType) { toast.error('Valj avtalstyp'); return }
    if (!title.trim()) { toast.error('Ange en titel'); return }

    setSaving(true)
    const { subtotal, taxAmount, totalAmount } = calcLineTotals(items)
    try {
      const contract = await ContractsAPI.create({
        contract_type: contractType,
        template_id: templateId,
        title,
        description: description || null,
        sections,
        project_id: projectId || null,
        client_id: clientId || null,
        counterparty_name: counterpartyName || null,
        start_date: startDate || null,
        end_date: endDate || null,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        items: items.filter(i => i.description.trim()).map((item, idx) => ({ ...item, sort_order: idx })),
      } as any)
      toast.success('Avtal skapat!')
      router.push(`/contracts/${contract.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte skapa avtal')
    } finally {
      setSaving(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Derived                                                           */
  /* ---------------------------------------------------------------- */

  const visibleTemplates = CONTRACT_TEMPLATES.filter(t =>
    contractType === 'subcontractor'
      ? SUBCONTRACTOR_TEMPLATE_IDS.includes(t.id)
      : CLIENT_TEMPLATE_IDS.includes(t.id)
  )

  const { subtotal, taxAmount, totalAmount } = calcLineTotals(items)

  const inputCls =
    'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
  const cardCls =
    'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6'

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/contracts')}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nytt avtal</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fyll i uppgifter och spara som utkast</p>
            </div>
          </div>

          {/* ===== SECTION 1: CONTRACT TYPE ===== */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              1. Avtalstyp
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  { type: 'client' as ContractType, label: 'Kundavtal', Icon: Users },
                  { type: 'subcontractor' as ContractType, label: 'UE-avtal', Icon: HardHat },
                ] as const
              ).map(({ type, label, Icon }) => {
                const selected = contractType === type
                return (
                  <button
                    key={type}
                    onClick={() => handleSelectType(type)}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 ${
                        selected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ===== SECTION 2: TEMPLATE ===== */}
          {contractType && (
            <div className={cardCls}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                2. Mall (valfritt)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleTemplates.map(tpl => {
                  const Icon = TEMPLATE_ICON_MAP[tpl.id] ?? FileText
                  const selected = templateId === tpl.id
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className={`text-left p-5 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                      }`}
                    >
                      <div
                        className={`mb-3 ${
                          selected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {tpl.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== SECTION 3: DETAILS ===== */}
          {contractType && (
            <div className={cardCls}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                3. Detaljer
              </h2>
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={labelCls}>Titel *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="T.ex. Takrenoveringsavtal — Villa Storgatan 12"
                    className={inputCls}
                  />
                </div>

                {/* Project */}
                <div>
                  <label className={labelCls}>Projekt</label>
                  <div className="relative">
                    <select
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      className={inputCls + ' appearance-none pr-10'}
                    >
                      <option value="">Valj projekt...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Client / Subcontractor */}
                {contractType === 'client' ? (
                  <div>
                    <label className={labelCls}>Kund</label>
                    <div className="relative">
                      <select
                        value={clientId}
                        onChange={e => handleClientChange(e.target.value)}
                        className={inputCls + ' appearance-none pr-10'}
                      >
                        <option value="">Valj kund...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={labelCls}>Underentreprenor</label>
                    <input
                      type="text"
                      value={counterpartyName}
                      onChange={e => setCounterpartyName(e.target.value)}
                      placeholder="Foretag eller namn..."
                      className={inputCls}
                    />
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Startdatum</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Slutdatum</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Arbetsbeskrivning</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Beskriv uppdraget kortfattat..."
                    className={inputCls + ' resize-none'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== SECTION 4: LINE ITEMS ===== */}
          {contractType && (
            <div className={cardCls}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  4. Radposter
                </h2>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition"
                >
                  <Plus className="w-4 h-4" />
                  Lagg till
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                  Inga radposter — klicka "Lagg till" for att borja.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Column headers */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                    <span className="col-span-4">Beskrivning</span>
                    <span className="col-span-1 text-right">Antal</span>
                    <span className="col-span-1">Enhet</span>
                    <span className="col-span-2 text-right">A-pris</span>
                    <span className="col-span-2">Typ</span>
                    <span className="col-span-1 text-right">Summa</span>
                    <span className="col-span-1" />
                  </div>

                  {items.map((item, idx) => {
                    const lineTotal = item.quantity * item.unit_price
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-900/40 rounded-lg p-2"
                      >
                        {/* Description */}
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          placeholder="Beskrivning"
                          className="col-span-12 sm:col-span-4 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {/* Antal */}
                        <input
                          type="number"
                          value={item.quantity}
                          min={0}
                          onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="col-span-3 sm:col-span-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {/* Enhet */}
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => updateItem(idx, 'unit', e.target.value)}
                          placeholder="st"
                          className="col-span-3 sm:col-span-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {/* A-pris */}
                        <input
                          type="number"
                          value={item.unit_price}
                          min={0}
                          onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="col-span-6 sm:col-span-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        {/* Typ */}
                        <select
                          value={item.item_type}
                          onChange={e => updateItem(idx, 'item_type', e.target.value as LineItem['item_type'])}
                          className="col-span-6 sm:col-span-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                          <option value="labor">Arbete</option>
                          <option value="material">Material</option>
                          <option value="other">Ovrigt</option>
                        </select>
                        {/* Summa */}
                        <span className="col-span-5 sm:col-span-1 text-sm text-gray-700 dark:text-gray-300 text-right font-medium">
                          {lineTotal.toLocaleString('sv-SE')}
                        </span>
                        {/* Delete */}
                        <button
                          onClick={() => removeItem(idx)}
                          className="col-span-1 flex justify-center text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}

                  {/* Totals */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1 text-sm text-right">
                    <div className="flex justify-end gap-6 text-gray-600 dark:text-gray-400">
                      <span>Netto</span>
                      <span className="w-28 text-right font-medium text-gray-900 dark:text-white">
                        {subtotal.toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                    <div className="flex justify-end gap-6 text-gray-600 dark:text-gray-400">
                      <span>Moms (25%)</span>
                      <span className="w-28 text-right font-medium text-gray-900 dark:text-white">
                        {taxAmount.toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                    <div className="flex justify-end gap-6 font-semibold text-gray-900 dark:text-white text-base pt-1">
                      <span>Totalt</span>
                      <span className="w-28 text-right">
                        {totalAmount.toLocaleString('sv-SE')} kr
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SECTION 5: TEMPLATE SECTIONS ===== */}
          {contractType && templateId && sections.length > 0 && (
            <div className={cardCls}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                5. Avtalsklausuler
              </h2>
              <div className="space-y-5">
                {sections.map((sec, idx) => (
                  <div key={idx}>
                    <label className={labelCls}>{sec.title}</label>
                    <textarea
                      rows={4}
                      value={sec.content}
                      onChange={e => updateSection(idx, e.target.value)}
                      className={inputCls + ' resize-y font-mono text-xs'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== BOTTOM ACTIONS ===== */}
          <div className="flex items-center justify-end gap-3 pb-10">
            <button
              onClick={() => router.push('/contracts')}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-semibold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Spara utkast
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
