'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { ContractsAPI } from '@/lib/api/contracts'
import type { Contract, ContractFilters, ContractMeta, ContractStatus, ContractType } from '@/types/contracts'
import { toast } from '@/lib/toast'
import {
  PenTool,
  Plus,
  Search,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  HardHat,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Format helpers                                                       */
/* ------------------------------------------------------------------ */

function formatDate(d: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(d))
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(n)
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: ContractStatus }) {
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
          <Send className="w-3 h-3" />
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

function TypeBadge({ type }: { type: ContractType }) {
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

const STATUS_OPTIONS: { value: ContractStatus | ''; label: string }[] = [
  { value: '', label: 'Alla' },
  { value: 'draft', label: 'Utkast' },
  { value: 'sent', label: 'Skickad' },
  { value: 'signed', label: 'Signerad' },
  { value: 'active', label: 'Aktiv' },
  { value: 'completed', label: 'Avslutad' },
  { value: 'cancelled', label: 'Avbruten' },
]

const TYPE_OPTIONS: { value: ContractType | ''; label: string }[] = [
  { value: '', label: 'Alla' },
  { value: 'client', label: 'Kundavtal' },
  { value: 'subcontractor', label: 'UE-avtal' },
]

export default function ContractsPage() {
  const { tenantId } = useTenant()
  const router = useRouter()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [meta, setMeta] = useState<ContractMeta>({ page: 1, limit: 20, count: 0 })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ContractFilters>({ page: 1, limit: 20 })

  const fetchContracts = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const result = await ContractsAPI.list({ ...filters, search: search || undefined })
      setContracts(result.data)
      setMeta(result.meta)
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte ladda avtal')
    } finally {
      setLoading(false)
    }
  }, [tenantId, filters, search])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  function handleStatusChange(value: string) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      status: value ? (value as ContractStatus) : undefined,
    }))
  }

  function handleTypeChange(value: string) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      contract_type: value ? (value as ContractType) : undefined,
    }))
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setFilters((prev) => ({ ...prev, page: 1 }))
  }

  const totalPages = meta.totalPages ?? Math.ceil(meta.count / meta.limit)
  const currentPage = meta.page

  function goToPage(page: number) {
    setFilters((prev) => ({ ...prev, page }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-500 rounded-lg shadow-md">
                <PenTool className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Avtal</h1>
                <p className="text-gray-600 dark:text-gray-400">Hantera kundavtal och UE-avtal</p>
              </div>
            </div>
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-semibold shadow-md hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              Nytt avtal
            </Link>
          </div>

          {/* Filters bar */}
          <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Sok avtal..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filters.status ?? ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Type filter */}
            <div className="relative">
              <select
                value={filters.contract_type ?? ''}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="p-16 flex flex-col items-center text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-40" />
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Inga avtal hittades</p>
                <p className="text-sm">Skapa ett nytt avtal eller justera filtren</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                      <th className="px-6 py-3">Avtalsnr</th>
                      <th className="px-6 py-3">Titel</th>
                      <th className="px-6 py-3">Motpart</th>
                      <th className="px-6 py-3">Typ</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Belopp</th>
                      <th className="px-6 py-3">Skapad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {contracts.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/contracts/${c.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {c.contract_number}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                          {c.title}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">
                          {c.counterparty_name || c.client?.name || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TypeBadge type={c.contract_type} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(c.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(c.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && meta.count > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {meta.count} avtal totalt
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Foregaende sida"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                    Sida {currentPage} av {totalPages || 1}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= (totalPages || 1)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Nasta sida"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
