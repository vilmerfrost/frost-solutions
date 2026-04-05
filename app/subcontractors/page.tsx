'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SearchBar from '@/components/SearchBar'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import {
  HardHat,
  Plus,
  Building2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  FolderOpen,
  Banknote,
} from 'lucide-react'

interface Subcontractor {
  id: string
  company_name: string
  org_number?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  f_skatt_verified?: boolean
  insurance_verified?: boolean
  insurance_expiry?: string | null
  active?: boolean
  created_at?: string
}

interface ApiResponse {
  success: boolean
  data: Subcontractor[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function InsuranceBadge({ verified, expiry }: { verified?: boolean; expiry?: string | null }) {
  if (!verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
        <ShieldX className="w-3 h-3" />
        Saknas
      </span>
    )
  }

  if (expiry) {
    const expiryDate = new Date(expiry)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <ShieldX className="w-3 h-3" />
          Utgangen
        </span>
      )
    }

    if (daysUntilExpiry <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          <ShieldAlert className="w-3 h-3" />
          {daysUntilExpiry}d
        </span>
      )
    }
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
      <ShieldCheck className="w-3 h-3" />
      OK
    </span>
  )
}

function FSkattBadge({ verified }: { verified?: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        F-skatt
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
      <XCircle className="w-3 h-3" />
      F-skatt
    </span>
  )
}

export default function SubcontractorsPage() {
  const router = useRouter()
  const { tenantId } = useTenant()
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create form state
  const [formData, setFormData] = useState({
    company_name: '',
    org_number: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  })

  const fetchSubcontractors = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await apiFetch<ApiResponse>('/api/subcontractors')
      setSubcontractors(res.data ?? [])
    } catch (err: any) {
      console.error('Failed to fetch subcontractors:', err)
      toast.error('Kunde inte hamta underentreprenorer')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }
    fetchSubcontractors()
  }, [tenantId, fetchSubcontractors])

  const filtered = useMemo(() => {
    if (!searchQuery) return subcontractors
    const q = searchQuery.toLowerCase()
    return subcontractors.filter(
      (s) =>
        s.company_name.toLowerCase().includes(q) ||
        s.org_number?.toLowerCase().includes(q) ||
        s.contact_name?.toLowerCase().includes(q) ||
        s.contact_email?.toLowerCase().includes(q)
    )
  }, [subcontractors, searchQuery])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.company_name.trim()) {
      toast.error('Foretagsnamn kravs')
      return
    }
    setCreating(true)
    try {
      await apiFetch<ApiResponse>('/api/subcontractors', {
        method: 'POST',
        body: JSON.stringify({
          company_name: formData.company_name.trim(),
          org_number: formData.org_number.trim() || undefined,
          contact_name: formData.contact_name.trim() || undefined,
          contact_email: formData.contact_email.trim() || undefined,
          contact_phone: formData.contact_phone.trim() || undefined,
        }),
      })
      toast.success('Underentreprenor skapad!')
      setShowCreateModal(false)
      setFormData({ company_name: '', org_number: '', contact_name: '', contact_email: '', contact_phone: '' })
      fetchSubcontractors()
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte skapa underentreprenor')
    } finally {
      setCreating(false)
    }
  }

  // Stats
  const totalSubs = subcontractors.length
  const fSkattVerified = subcontractors.filter((s) => s.f_skatt_verified).length
  const insuredCount = subcontractors.filter((s) => s.insurance_verified).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-500 rounded-lg shadow-md">
                  <HardHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Underentreprenorer
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Hantera underentreprenorer, F-skatt och forsakringar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-gray-900 px-6 py-3 rounded-[8px] font-semibold shadow-md hover:shadow-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ny underentreprenor
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Totalt</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalSubs}</p>
                  </div>
                  <div className="p-3 bg-stone-100 dark:bg-stone-900/30 rounded-lg">
                    <Building2 className="w-6 h-6 text-stone-600 dark:text-stone-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">F-skatt verifierad</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{fSkattVerified}</p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Forsakrade</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{insuredCount}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Sok foretagsnamn, org.nr, kontaktperson..."
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar underentreprenorer...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && subcontractors.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700">
              <HardHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Inga underentreprenorer annu
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Lagg till din forsta underentreprenor for att komma igang.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-6 py-3 rounded-[8px] font-semibold shadow-md hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Lagg till underentreprenor
              </button>
            </div>
          )}

          {/* No search results */}
          {!loading && subcontractors.length > 0 && filtered.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Inga underentreprenorer hittades
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Forsok med andra soktermer.
              </p>
            </div>
          )}

          {/* Subcontractor List */}
          {!loading && filtered.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Table header - hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Foretag</div>
                <div className="col-span-2">Org.nummer</div>
                <div className="col-span-2">F-skatt</div>
                <div className="col-span-2">Forsakring</div>
                <div className="col-span-2 text-right">Kontakt</div>
              </div>

              {/* Rows */}
              {filtered.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => router.push(`/subcontractors/${sub.id}`)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors group"
                >
                  {/* Company name */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0">
                      {sub.company_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {sub.company_name}
                      </p>
                      {sub.contact_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {sub.contact_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Org number */}
                  <div className="md:col-span-2 flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {sub.org_number || '-'}
                    </span>
                  </div>

                  {/* F-skatt */}
                  <div className="md:col-span-2 flex items-center">
                    <FSkattBadge verified={sub.f_skatt_verified} />
                  </div>

                  {/* Insurance */}
                  <div className="md:col-span-2 flex items-center">
                    <InsuranceBadge verified={sub.insurance_verified} expiry={sub.insurance_expiry} />
                  </div>

                  {/* Arrow */}
                  <div className="md:col-span-2 flex items-center justify-end">
                    {sub.contact_email && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 mr-2 hidden lg:inline truncate max-w-[120px]">
                        {sub.contact_email}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Ny underentreprenor
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Foretagsnamn *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="AB Bygg & Montage"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organisationsnummer
                </label>
                <input
                  type="text"
                  value={formData.org_number}
                  onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="556123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kontaktperson
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Erik Svensson"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="erik@foretag.se"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="070-123 45 67"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-semibold shadow-md hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Skapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
