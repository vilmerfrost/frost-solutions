'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { apiFetch } from '@/lib/http/fetcher'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

/* ── Types ─────────────────────────────────────────────────── */

interface KPI {
  label: string
  value: number
  previous: number
  format: 'sek' | 'percent'
}

interface ProfitabilityRow {
  name: string
  revenue: number
  cost: number
  margin: number
}

interface ProfitabilityResponse {
  kpis: KPI[]
  rows: ProfitabilityRow[]
  ai_prediction?: string
}

interface UtilizationRow {
  employee_name: string
  billable_hours: number
  non_billable_hours: number
  total_hours: number
  utilization_percent: number
  overtime_hours: number
}

interface UtilizationResponse {
  rows: UtilizationRow[]
}

interface CashFlowRow {
  month: string
  inflow: number
  outflow: number
  net: number
}

interface CashFlowResponse {
  rows: CashFlowRow[]
}

interface SavedReport {
  id: string
  name: string
  type: string
  last_generated: string
}

interface SavedReportsResponse {
  reports: SavedReport[]
}

/* ── Helpers ───────────────────────────────────────────────── */

function sek(n: number) {
  return Number(n ?? 0).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 })
}

function pct(n: number) {
  return `${Number(n ?? 0).toFixed(1)}%`
}

function changeIndicator(current: number, previous: number) {
  if (previous === 0) return null
  const diff = ((current - previous) / Math.abs(previous)) * 100
  const isPositive = diff > 0
  return (
    <span className={`text-xs font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
      {isPositive ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%
    </span>
  )
}

function utilizationColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

/* ── Skeletons ─────────────────────────────────────────────── */

function SkeletonKPI() {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-stone-700 animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-stone-700 rounded w-20 mb-3" />
      <div className="h-7 bg-gray-200 dark:bg-stone-700 rounded w-32 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-stone-700 rounded w-16" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-6 border border-gray-100 dark:border-stone-700 animate-pulse">
      <div className="h-64 bg-gray-100 dark:bg-stone-700 rounded" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md border border-gray-100 dark:border-stone-700 overflow-hidden">
      <div className="p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-stone-700 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}

/* ── Tooltip formatters ────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const currencyFormatter = (value: any) => {
  if (typeof value === 'number') return sek(value)
  return String(value ?? '')
}

/* ── Component ─────────────────────────────────────────────── */

export default function ReportsPage() {
  const { tenantId } = useTenant()

  // Tabs
  const [activeTab, setActiveTab] = useState<'profitability' | 'utilization' | 'cashflow' | 'saved'>('profitability')

  // Period
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [period, setPeriod] = useState(currentPeriod)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [periodMode, setPeriodMode] = useState<'month' | 'custom'>('month')

  // Profitability
  const [profitKPIs, setProfitKPIs] = useState<KPI[]>([])
  const [profitRows, setProfitRows] = useState<ProfitabilityRow[]>([])
  const [profitLoading, setProfitLoading] = useState(false)
  const [profitError, setProfitError] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'project' | 'client' | 'employee'>('project')
  const [aiPrediction, setAiPrediction] = useState<string>('')

  // Utilization
  const [utilRows, setUtilRows] = useState<UtilizationRow[]>([])
  const [utilLoading, setUtilLoading] = useState(false)
  const [utilError, setUtilError] = useState<string | null>(null)

  // Cash flow
  const [cashRows, setCashRows] = useState<CashFlowRow[]>([])
  const [cashLoading, setCashLoading] = useState(false)
  const [cashError, setCashError] = useState<string | null>(null)

  // Saved reports
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [savedLoading, setSavedLoading] = useState(false)

  /* ── Fetch functions ─────────────────────────────────────── */

  const fetchProfitability = useCallback(async () => {
    if (!tenantId) return
    setProfitLoading(true)
    setProfitError(null)
    try {
      const params = new URLSearchParams({ period, groupBy })
      if (periodMode === 'custom' && customFrom && customTo) {
        params.set('from', customFrom)
        params.set('to', customTo)
      }
      const data = await apiFetch<ProfitabilityResponse>(`/api/reports/profitability?${params}`)
      setProfitKPIs(data.kpis ?? [])
      setProfitRows(data.rows ?? [])
      setAiPrediction(data.ai_prediction ?? '')
    } catch (err: any) {
      setProfitError(err.message || 'Kunde inte hämta lönsamhetsdata')
    } finally {
      setProfitLoading(false)
    }
  }, [tenantId, period, groupBy, periodMode, customFrom, customTo])

  const fetchUtilization = useCallback(async () => {
    if (!tenantId) return
    setUtilLoading(true)
    setUtilError(null)
    try {
      const data = await apiFetch<UtilizationResponse>(`/api/reports/utilization?period=${period}`)
      setUtilRows(data.rows ?? [])
    } catch (err: any) {
      setUtilError(err.message || 'Kunde inte hämta beläggningsdata')
    } finally {
      setUtilLoading(false)
    }
  }, [tenantId, period])

  const fetchCashFlow = useCallback(async () => {
    if (!tenantId) return
    setCashLoading(true)
    setCashError(null)
    try {
      const data = await apiFetch<CashFlowResponse>('/api/reports/cashflow?months=6')
      setCashRows(data.rows ?? [])
    } catch (err: any) {
      setCashError(err.message || 'Kunde inte hämta kassaflödesdata')
    } finally {
      setCashLoading(false)
    }
  }, [tenantId])

  const fetchSaved = useCallback(async () => {
    if (!tenantId) return
    setSavedLoading(true)
    try {
      const data = await apiFetch<SavedReportsResponse>('/api/reports/saved')
      setSavedReports(data.reports ?? [])
    } catch {
      // silent
    } finally {
      setSavedLoading(false)
    }
  }, [tenantId])

  /* ── Fetch on tab/period change ──────────────────────────── */

  useEffect(() => {
    if (activeTab === 'profitability') fetchProfitability()
    if (activeTab === 'utilization') fetchUtilization()
    if (activeTab === 'cashflow') fetchCashFlow()
    if (activeTab === 'saved') fetchSaved()
  }, [activeTab, fetchProfitability, fetchUtilization, fetchCashFlow, fetchSaved])

  /* ── Export ──────────────────────────────────────────────── */

  async function handleExport() {
    try {
      const blob = await apiFetch<Blob>('/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({ tab: activeTab, period, groupBy }),
        parse: 'text',
      })
      // trigger download
      const url = window.URL.createObjectURL(new Blob([blob as unknown as BlobPart], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-${activeTab}-${period}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      // could not export
    }
  }

  async function handleGenerate(reportId: string) {
    try {
      await apiFetch(`/api/reports/saved/${reportId}/generate`, { method: 'POST' })
      fetchSaved()
    } catch {
      // silent
    }
  }

  /* ── Tabs config ─────────────────────────────────────────── */

  const tabs = [
    { key: 'profitability' as const, label: 'Lönsamhet' },
    { key: 'utilization' as const, label: 'Beläggning' },
    { key: 'cashflow' as const, label: 'Kassaflöde' },
    { key: 'saved' as const, label: 'Sparade' },
  ]

  /* ── Period options (last 12 months) ─────────────────────── */

  const periodOptions: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })
    periodOptions.push({ value: val, label })
  }

  const groupByOptions = [
    { value: 'project', label: 'Per projekt' },
    { value: 'client', label: 'Per kund' },
    { value: 'employee', label: 'Per anställd' },
  ]

  /* ── KPI card helper ─────────────────────────────────────── */

  function KPICard({ kpi }: { kpi: KPI }) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-stone-700 transform transition-all duration-300 hover:scale-105">
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          {kpi.label}
        </div>
        <div className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1">
          {kpi.format === 'sek' ? sek(kpi.value) : pct(kpi.value)}
        </div>
        <div>{changeIndicator(kpi.value, kpi.previous)}</div>
      </div>
    )
  }

  /* ── Error block helper ──────────────────────────────────── */

  function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-8 text-center">
        <p className="text-red-500 dark:text-red-400 mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-6 py-2 rounded-[8px] font-bold shadow-md transition"
        >
          Försök igen
        </button>
      </div>
    )
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Rapporter
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Ekonomisk översikt och analys
              </p>
            </div>

            {/* Period selector + export */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Period mode toggle */}
              <div className="flex gap-1 bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 rounded-[8px] p-0.5">
                <button
                  onClick={() => setPeriodMode('month')}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition ${
                    periodMode === 'month'
                      ? 'bg-primary-500 text-gray-900 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-stone-700'
                  }`}
                >
                  Månad
                </button>
                <button
                  onClick={() => setPeriodMode('custom')}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition ${
                    periodMode === 'custom'
                      ? 'bg-primary-500 text-gray-900 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-stone-700'
                  }`}
                >
                  Anpassat
                </button>
              </div>

              {periodMode === 'month' ? (
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-4 py-2.5 rounded-[8px] border-2 border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none transition"
                >
                  {periodOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="px-3 py-2 rounded-[8px] border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="px-3 py-2 rounded-[8px] border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                onClick={handleExport}
                className="bg-white dark:bg-stone-800 border-2 border-gray-200 dark:border-stone-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-[8px] font-semibold hover:bg-gray-50 dark:hover:bg-stone-700 transition text-sm"
              >
                📥 Exportera CSV
              </button>
            </div>
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

          {/* ═══════════ TAB 1: Lönsamhet ═══════════ */}
          {activeTab === 'profitability' && (
            <div className="space-y-6">
              {profitError ? (
                <ErrorBlock message={profitError} onRetry={fetchProfitability} />
              ) : (
                <>
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {profitLoading
                      ? Array.from({ length: 3 }).map((_, i) => <SkeletonKPI key={i} />)
                      : profitKPIs.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
                  </div>

                  {/* Group by selector */}
                  <div className="flex gap-2 flex-wrap">
                    {groupByOptions.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setGroupBy(g.value as typeof groupBy)}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition ${
                          groupBy === g.value
                            ? 'bg-primary-500 text-gray-900 shadow-sm'
                            : 'bg-white dark:bg-stone-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-stone-700 hover:bg-gray-100 dark:hover:bg-stone-700'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>

                  {/* Bar chart */}
                  {profitLoading ? (
                    <SkeletonChart />
                  ) : profitRows.length > 0 ? (
                    <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-stone-700">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={profitRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#78716c' }}
                            axisLine={{ stroke: '#d6d3d1' }}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: '#78716c' }}
                            axisLine={{ stroke: '#d6d3d1' }}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            formatter={currencyFormatter}
                            contentStyle={{
                              backgroundColor: '#292524',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fafaf9',
                              fontSize: '13px',
                            }}
                            labelStyle={{ color: '#a8a29e' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '13px' }} />
                          <Bar dataKey="revenue" name="Intäkter" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="cost" name="Kostnader" fill="#78716c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-8 border border-gray-100 dark:border-stone-700 text-center text-gray-400 dark:text-gray-500">
                      Ingen data för vald period
                    </div>
                  )}

                  {/* AI prediction */}
                  {aiPrediction && (
                    <p className="text-sm italic text-stone-500 dark:text-stone-400 px-1">
                      🤖 {aiPrediction}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══════════ TAB 2: Beläggning ═══════════ */}
          {activeTab === 'utilization' && (
            <div className="space-y-6">
              {utilError ? (
                <ErrorBlock message={utilError} onRetry={fetchUtilization} />
              ) : utilLoading ? (
                <SkeletonTable />
              ) : utilRows.length === 0 ? (
                <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-8 border border-gray-100 dark:border-stone-700 text-center text-gray-400 dark:text-gray-500">
                  Ingen beläggningsdata för vald period
                </div>
              ) : (
                <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md border border-gray-100 dark:border-stone-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[700px]">
                      <thead className="bg-gray-50 dark:bg-stone-900">
                        <tr>
                          <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                            Anställd
                          </th>
                          <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                            Debiterbar
                          </th>
                          <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                            Ej debiterbar
                          </th>
                          <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                            Totalt
                          </th>
                          <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs w-48">
                            Beläggning
                          </th>
                          <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                            Övertid
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-stone-700">
                        {utilRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors">
                            <td className="p-3 sm:p-4 font-medium text-gray-900 dark:text-white">
                              {row.employee_name}
                            </td>
                            <td className="p-3 sm:p-4 text-right text-gray-700 dark:text-gray-300">
                              {row.billable_hours.toFixed(1)}h
                            </td>
                            <td className="p-3 sm:p-4 text-right text-gray-500 dark:text-gray-400">
                              {row.non_billable_hours.toFixed(1)}h
                            </td>
                            <td className="p-3 sm:p-4 text-right font-semibold text-gray-900 dark:text-white">
                              {row.total_hours.toFixed(1)}h
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-stone-700 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${utilizationColor(row.utilization_percent)}`}
                                    style={{ width: `${Math.min(100, row.utilization_percent)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-10 text-right">
                                  {pct(row.utilization_percent)}
                                </span>
                              </div>
                            </td>
                            <td className={`p-3 sm:p-4 text-right font-medium ${
                              row.overtime_hours > 0
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {row.overtime_hours > 0 ? `${row.overtime_hours.toFixed(1)}h` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB 3: Kassaflöde ═══════════ */}
          {activeTab === 'cashflow' && (
            <div className="space-y-6">
              {cashError ? (
                <ErrorBlock message={cashError} onRetry={fetchCashFlow} />
              ) : cashLoading ? (
                <>
                  <SkeletonChart />
                  <SkeletonTable />
                </>
              ) : cashRows.length === 0 ? (
                <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-8 border border-gray-100 dark:border-stone-700 text-center text-gray-400 dark:text-gray-500">
                  Ingen kassaflödesdata tillgänglig
                </div>
              ) : (
                <>
                  {/* Line chart */}
                  <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-stone-700">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={cashRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12, fill: '#78716c' }}
                          axisLine={{ stroke: '#d6d3d1' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#78716c' }}
                          axisLine={{ stroke: '#d6d3d1' }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={currencyFormatter}
                          contentStyle={{
                            backgroundColor: '#292524',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fafaf9',
                            fontSize: '13px',
                          }}
                          labelStyle={{ color: '#a8a29e' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '13px' }} />
                        <Line type="monotone" dataKey="inflow" name="Inbetalningar" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4, fill: '#F59E0B' }} />
                        <Line type="monotone" dataKey="outflow" name="Utbetalningar" stroke="#78716c" strokeWidth={2} dot={{ r: 4, fill: '#78716c' }} />
                        <Line type="monotone" dataKey="net" name="Netto" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#22c55e' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md border border-gray-100 dark:border-stone-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm min-w-[500px]">
                        <thead className="bg-gray-50 dark:bg-stone-900">
                          <tr>
                            <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Månad
                            </th>
                            <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Inbetalningar
                            </th>
                            <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Utbetalningar
                            </th>
                            <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                              Netto
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-stone-700">
                          {cashRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors">
                              <td className="p-3 sm:p-4 font-medium text-gray-900 dark:text-white">
                                {row.month}
                              </td>
                              <td className="p-3 sm:p-4 text-right text-gray-700 dark:text-gray-300">
                                {sek(row.inflow)}
                              </td>
                              <td className="p-3 sm:p-4 text-right text-gray-500 dark:text-gray-400">
                                {sek(row.outflow)}
                              </td>
                              <td className={`p-3 sm:p-4 text-right font-semibold ${
                                row.net >= 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-500 dark:text-red-400'
                              }`}>
                                {sek(row.net)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════════ TAB 4: Sparade ═══════════ */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-5 py-2.5 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm"
                >
                  + Ny rapport
                </button>
              </div>

              {savedLoading ? (
                <SkeletonTable />
              ) : savedReports.length === 0 ? (
                <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md p-8 border border-gray-100 dark:border-stone-700 text-center text-gray-400 dark:text-gray-500">
                  Inga sparade rapporter ännu
                </div>
              ) : (
                <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-md border border-gray-100 dark:border-stone-700 overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-stone-700">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-stone-700/50 transition-colors gap-3"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {report.name}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                              {report.type}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Senast genererad:{' '}
                              {report.last_generated
                                ? new Date(report.last_generated).toLocaleDateString('sv-SE')
                                : 'Aldrig'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerate(report.id)}
                          className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-4 py-2 rounded-[8px] font-bold shadow-md transition text-sm w-full sm:w-auto"
                        >
                          Generera
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
