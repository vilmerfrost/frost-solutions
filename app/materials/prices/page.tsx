'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { apiFetch } from '@/lib/http/fetcher'

/* ── Types ─────────────────────────────────────────────────── */

interface SupplierPrices {
  byggmax?: number | null
  beijer?: number | null
  xl_bygg?: number | null
  ahlsell?: number | null
}

interface PriceResult {
  id: string
  product_name: string
  category: string
  unit: string
  prices: SupplierPrices
  price_change_percent?: number | null
}

interface PriceSearchResponse {
  results: PriceResult[]
  updated_at: string
  changes_today: number
}

interface MaterialListItem {
  id: string
  product_name: string
  cheapest_supplier: string
  unit_price: number
  quantity: number
  line_total: number
  savings: number
}

interface CompareResponse {
  items: MaterialListItem[]
  total_cost: number
  total_savings: number
}

interface Project {
  id: string
  name: string
}

interface PriceAlert {
  id: string
  product_pattern: string
  threshold_percent: number
  direction: 'drop' | 'rise'
  active: boolean
}

/* ── Constants ─────────────────────────────────────────────── */

const CATEGORIES = [
  { key: 'alla', label: 'Alla' },
  { key: 'tra', label: 'Trä & Virke' },
  { key: 'skruv', label: 'Skruv & Fäste' },
  { key: 'isolering', label: 'Isolering' },
  { key: 'el', label: 'El' },
  { key: 'vvs', label: 'VVS' },
]

const SUPPLIERS = ['byggmax', 'beijer', 'xl_bygg', 'ahlsell'] as const
const SUPPLIER_LABELS: Record<string, string> = {
  byggmax: 'BYGGMAX',
  beijer: 'BEIJER',
  xl_bygg: 'XL-BYGG',
  ahlsell: 'AHLSELL',
}

/* ── Helpers ───────────────────────────────────────────────── */

function sek(n: number) {
  return Number(n ?? 0).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
}

function cheapestSupplier(prices: SupplierPrices): string | null {
  let min = Infinity
  let supplier: string | null = null
  for (const [key, val] of Object.entries(prices)) {
    if (val != null && val < min) {
      min = val
      supplier = key
    }
  }
  return supplier
}

/* ── Skeleton Helpers ──────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="p-3 sm:p-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
        </td>
      ))}
    </tr>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-stone-700 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
    </div>
  )
}

/* ── Component ─────────────────────────────────────────────── */

export default function MaterialPricesPage() {
  const { tenantId } = useTenant()

  // Tab state
  const [activeTab, setActiveTab] = useState<'search' | 'list'>('search')

  // ── Search tab state ──
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('alla')
  const [searchResults, setSearchResults] = useState<PriceResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string>('')
  const [changesToday, setChangesToday] = useState(0)

  // ── Material list tab state ──
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [listItems, setListItems] = useState<MaterialListItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [totalCost, setTotalCost] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [watchActive, setWatchActive] = useState(false)
  const [addingMaterial, setAddingMaterial] = useState(false)
  const [addSearch, setAddSearch] = useState('')

  // ── Alerts state ──
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [showAddAlert, setShowAddAlert] = useState(false)
  const [newAlertPattern, setNewAlertPattern] = useState('')
  const [newAlertThreshold, setNewAlertThreshold] = useState(5)
  const [newAlertDirection, setNewAlertDirection] = useState<'drop' | 'rise'>('drop')

  /* ── Data fetching ───────────────────────────────────────── */

  const fetchPrices = useCallback(async () => {
    if (!tenantId) return
    setSearchLoading(true)
    setSearchError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (category !== 'alla') params.set('category', category)
      const data = await apiFetch<PriceSearchResponse>(`/api/materials/prices?${params.toString()}`)
      setSearchResults(data.results ?? [])
      setUpdatedAt(data.updated_at ?? '')
      setChangesToday(data.changes_today ?? 0)
    } catch (err: any) {
      setSearchError(err.message || 'Kunde inte hämta priser')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [tenantId, search, category])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPrices()
    }, 300)
    return () => clearTimeout(timeout)
  }, [fetchPrices])

  const fetchAlerts = useCallback(async () => {
    if (!tenantId) return
    setAlertsLoading(true)
    try {
      const data = await apiFetch<{ alerts: PriceAlert[] }>('/api/materials/prices/alerts')
      setAlerts(data.alerts ?? [])
    } catch {
      // silent — alerts are secondary
    } finally {
      setAlertsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  /* ── Handlers ────────────────────────────────────────────── */

  function handleQuantityChange(idx: number, qty: number) {
    setListItems((prev) => {
      const updated = [...prev]
      const item = { ...updated[idx] }
      item.quantity = qty
      item.line_total = item.unit_price * qty
      updated[idx] = item
      return updated
    })
  }

  async function handleAddAlert() {
    if (!newAlertPattern.trim()) return
    try {
      await apiFetch('/api/materials/prices/alerts', {
        method: 'POST',
        body: JSON.stringify({
          product_pattern: newAlertPattern,
          threshold_percent: newAlertThreshold,
          direction: newAlertDirection,
        }),
      })
      setShowAddAlert(false)
      setNewAlertPattern('')
      fetchAlerts()
    } catch {
      // error handling
    }
  }

  async function toggleAlert(alertId: string, active: boolean) {
    try {
      await apiFetch(`/api/materials/prices/alerts`, {
        method: 'PATCH',
        body: JSON.stringify({ id: alertId, active }),
      })
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, active } : a))
      )
    } catch {
      // silent
    }
  }

  /* ── Tabs ────────────────────────────────────────────────── */

  const tabs = [
    { key: 'search' as const, label: 'Sok priser' },
    { key: 'list' as const, label: 'Materiallista' },
  ]

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Materialpriser
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Jämför priser från Sveriges största byggmaterialleverantörer
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-[8px] font-semibold transition text-sm sm:text-base ${
                  activeTab === t.key
                    ? 'bg-primary-500 hover:bg-primary-600 text-gray-900 shadow-md'
                    : 'bg-white dark:bg-stone-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-stone-700 hover:bg-gray-50 dark:hover:bg-stone-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ═══════════ TAB 1: Sök priser ═══════════ */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder='Sök material... t.ex. "plywood 12mm"'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-none transition text-sm sm:text-base"
                />
              </div>

              {/* Category chips */}
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition ${
                      category === c.key
                        ? 'bg-primary-500 text-gray-900 shadow-sm'
                        : 'bg-white dark:bg-stone-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-stone-700 hover:bg-gray-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Results table */}
              {searchError ? (
                <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-8 text-center">
                  <p className="text-red-500 dark:text-red-400 mb-4">{searchError}</p>
                  <button
                    onClick={fetchPrices}
                    className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-6 py-2 rounded-[8px] font-bold shadow-md transition"
                  >
                    Försök igen
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md border border-gray-100 dark:border-stone-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[700px]">
                      <thead className="bg-gray-50 dark:bg-stone-900">
                        <tr>
                          <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                            Produkt
                          </th>
                          {SUPPLIERS.map((s) => (
                            <th
                              key={s}
                              className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs"
                            >
                              {SUPPLIER_LABELS[s]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-stone-700">
                        {searchLoading ? (
                          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : searchResults.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">
                              {search ? 'Inga produkter matchade din sökning' : 'Ange en sökterm för att hitta material'}
                            </td>
                          </tr>
                        ) : (
                          searchResults.map((r) => {
                            const cheapest = cheapestSupplier(r.prices)
                            return (
                              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors">
                                <td className="p-3 sm:p-4">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {r.product_name}
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {r.unit}
                                    {r.price_change_percent != null && r.price_change_percent !== 0 && (
                                      <span
                                        className={`ml-2 font-semibold ${
                                          r.price_change_percent < 0
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-500 dark:text-red-400'
                                        }`}
                                      >
                                        {r.price_change_percent < 0 ? '↓' : '↑'}
                                        {Math.abs(r.price_change_percent).toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </td>
                                {SUPPLIERS.map((s) => {
                                  const price = r.prices[s]
                                  const isCheapest = s === cheapest
                                  return (
                                    <td
                                      key={s}
                                      className={`p-3 sm:p-4 text-right font-medium ${
                                        isCheapest
                                          ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {price != null ? (
                                        <>
                                          {isCheapest && <span className="mr-1">★</span>}
                                          {sek(price)}
                                        </>
                                      ) : (
                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  {!searchLoading && searchResults.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-stone-900 border-t border-gray-100 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Senast uppdaterad: {updatedAt || 'Idag 23:59'}</span>
                      {changesToday > 0 && (
                        <span>
                          Prisförändringar idag: ↓ {changesToday} produkter billigare
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB 2: Materiallista ═══════════ */}
          {activeTab === 'list' && (
            <div className="space-y-6">
              {/* Project selector */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Projekt:
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 rounded-[8px] border-2 border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none transition"
                >
                  <option value="">Välj projekt...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material list table */}
              <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md border border-gray-100 dark:border-stone-700 overflow-hidden">
                {listLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 dark:bg-stone-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : listError ? (
                  <div className="p-8 text-center">
                    <p className="text-red-500 dark:text-red-400 mb-4">{listError}</p>
                    <button
                      onClick={() => { setListError(null) }}
                      className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-6 py-2 rounded-[8px] font-bold shadow-md transition"
                    >
                      Försök igen
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm min-w-[600px]">
                        <thead className="bg-gray-50 dark:bg-stone-900">
                          <tr>
                            <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Produkt
                            </th>
                            <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Billigaste leverantör
                            </th>
                            <th className="p-3 sm:p-4 text-center font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Antal
                            </th>
                            <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Radsumma
                            </th>
                            <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Besparing
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-stone-700">
                          {listItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">
                                Inga material tillagda ännu. Klicka &quot;Lägg till material&quot; nedan.
                              </td>
                            </tr>
                          ) : (
                            listItems.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors">
                                <td className="p-3 sm:p-4 font-medium text-gray-900 dark:text-white">
                                  {item.product_name}
                                </td>
                                <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400">
                                  <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold">
                                    {SUPPLIER_LABELS[item.cheapest_supplier] || item.cheapest_supplier}
                                  </span>
                                </td>
                                <td className="p-3 sm:p-4 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(idx, Math.max(1, parseInt(e.target.value) || 1))
                                    }
                                    className="w-20 text-center px-2 py-1 rounded-[8px] border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none"
                                  />
                                </td>
                                <td className="p-3 sm:p-4 text-right font-semibold text-gray-900 dark:text-white">
                                  {sek(item.line_total)}
                                </td>
                                <td className="p-3 sm:p-4 text-right text-green-600 dark:text-green-400 font-semibold">
                                  {item.savings > 0 ? `−${sek(item.savings)}` : '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Add material */}
                    <div className="p-4 border-t border-gray-100 dark:border-stone-700">
                      {addingMaterial ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Sök material att lägga till..."
                            value={addSearch}
                            onChange={(e) => setAddSearch(e.target.value)}
                            className="flex-1 px-4 py-2 rounded-[8px] border-2 border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => { setAddingMaterial(false); setAddSearch('') }}
                            className="px-4 py-2 rounded-[8px] text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-stone-700 hover:bg-gray-100 dark:hover:bg-stone-700 transition"
                          >
                            Avbryt
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingMaterial(true)}
                          className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-5 py-2.5 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm"
                        >
                          + Lägg till material
                        </button>
                      )}
                    </div>

                    {/* Summary */}
                    {listItems.length > 0 && (
                      <div className="px-4 py-4 bg-gray-50 dark:bg-stone-900 border-t border-gray-100 dark:border-stone-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex gap-6">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Total kostnad
                              </div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {sek(listItems.reduce((sum, i) => sum + i.line_total, 0))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Total besparing
                              </div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {sek(listItems.reduce((sum, i) => sum + i.savings, 0))}
                              </div>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={watchActive}
                              onChange={(e) => setWatchActive(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-stone-600 text-primary-500 focus:ring-primary-500"
                            />
                            <span>🔔 Bevaka prisändringar på denna lista</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ Price Alerts (bottom, always visible) ═══════════ */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dina prisaviseringar
              </h2>
              <button
                onClick={() => setShowAddAlert(!showAddAlert)}
                className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-4 py-2 rounded-[8px] font-bold shadow-md transition text-sm"
              >
                + Ny avisering
              </button>
            </div>

            {/* Add alert form */}
            {showAddAlert && (
              <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md border border-gray-100 dark:border-stone-700 p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Produktmönster
                    </label>
                    <input
                      type="text"
                      placeholder='t.ex. "plywood"'
                      value={newAlertPattern}
                      onChange={(e) => setNewAlertPattern(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Tröskel (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newAlertThreshold}
                      onChange={(e) => setNewAlertThreshold(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 rounded-[8px] border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Riktning
                    </label>
                    <select
                      value={newAlertDirection}
                      onChange={(e) => setNewAlertDirection(e.target.value as 'drop' | 'rise')}
                      className="w-full px-3 py-2 rounded-[8px] border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="drop">Prissänkning</option>
                      <option value="rise">Prishöjning</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddAlert}
                    className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-5 py-2 rounded-[8px] font-bold shadow-md transition text-sm h-[38px]"
                  >
                    Spara
                  </button>
                </div>
              </div>
            )}

            {/* Alerts list */}
            <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md border border-gray-100 dark:border-stone-700 overflow-hidden">
              {alertsLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 dark:bg-stone-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                  Inga prisaviseringar skapade ännu
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-stone-700">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.product_pattern}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          alert.direction === 'drop'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                          {alert.direction === 'drop' ? '↓' : '↑'} {alert.threshold_percent}%
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alert.active}
                          onChange={(e) => toggleAlert(alert.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 dark:bg-stone-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
