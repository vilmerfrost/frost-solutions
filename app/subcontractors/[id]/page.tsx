'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  Receipt,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react'

interface Subcontractor {
  id: string
  company_name: string
  org_number?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  f_skatt_verified?: boolean
  f_skatt_verified_at?: string | null
  insurance_verified?: boolean
  insurance_expiry?: string | null
  notes?: string | null
  active?: boolean
  created_at?: string
}

interface Assignment {
  id: string
  project_id: string
  scope?: string | null
  budget_sek?: number | null
  status: string
  created_at: string
  project_name?: string
}

interface PaymentInvoice {
  id: string
  invoice_number?: string
  invoiced_amount: number
  paid_amount: number
  outstanding_amount: number
  payment_status: string
  invoice_date?: string
  due_date?: string
}

interface PaymentData {
  subcontractor: { id: string; company_name: string }
  invoices: PaymentInvoice[]
  totals: { invoiced: number; paid: number; outstanding: number }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('sv-SE').format(new Date(dateStr))
}

export default function SubcontractorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tenantId } = useTenant()
  const id = params?.id as string

  const [sub, setSub] = useState<Subcontractor | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [payments, setPayments] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  const fetchData = useCallback(async () => {
    if (!tenantId || !id) return
    setLoading(true)
    try {
      const [subRes, assignRes, payRes] = await Promise.allSettled([
        apiFetch<{ success: boolean; data: Subcontractor }>(`/api/subcontractors/${id}`),
        apiFetch<{ success: boolean; data: Assignment[] }>(`/api/subcontractors/${id}/assignments`),
        apiFetch<{ success: boolean; data: PaymentData }>(`/api/subcontractors/${id}/payments`),
      ])

      if (subRes.status === 'fulfilled') setSub(subRes.value.data)
      else toast.error('Kunde inte hamta underentreprenor')

      if (assignRes.status === 'fulfilled') setAssignments(assignRes.value.data ?? [])
      if (payRes.status === 'fulfilled') setPayments(payRes.value.data ?? null)
    } catch (err: any) {
      toast.error('Kunde inte hamta data')
    } finally {
      setLoading(false)
    }
  }, [tenantId, id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleVerifyFSkatt() {
    setVerifying(true)
    try {
      const res = await apiFetch<{
        success: boolean
        data: { verified: boolean; manual_check_required?: boolean; message?: string }
      }>(`/api/subcontractors/${id}/verify-fskatt`, { method: 'POST' })

      if (res.data?.manual_check_required) {
        toast.error(res.data.message || 'Automatisk verifiering ej tillgänglig. Kontrollera manuellt på skatteverket.se.')
      } else if (res.data?.verified) {
        toast.success('F-skatt verifierad!')
      }
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Verifiering misslyckades')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </main>
      </div>
    )
  }

  if (!sub) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Underentreprenor hittades inte
            </h2>
            <button
              onClick={() => router.push('/subcontractors')}
              className="text-primary-500 hover:underline"
            >
              Tillbaka till listan
            </button>
          </div>
        </main>
      </div>
    )
  }

  const totals = payments?.totals ?? { invoiced: 0, paid: 0, outstanding: 0 }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {/* Back button */}
          <button
            onClick={() => router.push('/subcontractors')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Tillbaka</span>
          </button>

          {/* Company Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow">
                  {sub.company_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sub.company_name}
                  </h1>
                  {sub.org_number && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                      Org.nr: {sub.org_number}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {sub.contact_name && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4" />
                        {sub.contact_name}
                      </span>
                    )}
                    {sub.contact_email && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        {sub.contact_email}
                      </span>
                    )}
                    {sub.contact_phone && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        {sub.contact_phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-col gap-3">
                {/* F-skatt */}
                <div className="flex items-center gap-3">
                  {sub.f_skatt_verified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      F-skatt verifierad
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      <XCircle className="w-4 h-4" />
                      F-skatt ej verifierad
                    </span>
                  )}
                  <button
                    onClick={handleVerifyFSkatt}
                    disabled={verifying}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {verifying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Verifiera
                  </button>
                </div>

                {/* Insurance */}
                <div className="flex items-center gap-2">
                  {sub.insurance_verified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="w-4 h-4" />
                      Forsakring OK
                      {sub.insurance_expiry && (
                        <span className="text-xs opacity-75 ml-1">
                          (utgar {formatDate(sub.insurance_expiry)})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      <ShieldX className="w-4 h-4" />
                      Forsakring saknas
                    </span>
                  )}
                </div>
              </div>
            </div>

            {sub.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">{sub.notes}</p>
              </div>
            )}
          </div>

          {/* Payment KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fakturerat</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totals.invoiced)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Betalt</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.paid)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Banknote className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Utestaende</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(totals.outstanding)}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Two-column layout: Assignments + Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Projects */}
            <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tilldelade projekt
                </h2>
                <button className="px-3 py-1.5 text-xs font-medium bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Tilldela projekt
                </button>
              </div>
              {assignments.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inga tilldelade projekt annu</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {assignments.map((a) => (
                    <div key={a.id} className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {a.project_name || a.project_id.slice(0, 8)}
                          </p>
                          {a.scope && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {a.scope}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {a.budget_sek != null && (
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                              {formatCurrency(a.budget_sek)}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.status === 'active'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : a.status === 'completed'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {a.status === 'active'
                              ? 'Aktiv'
                              : a.status === 'completed'
                              ? 'Klar'
                              : 'Avslutad'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment List */}
            <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Fakturor & betalningar
                </h2>
              </div>
              {(!payments || payments.invoices.length === 0) ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inga fakturor registrerade</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {payments.invoices.map((inv) => (
                    <div key={inv.id} className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {inv.invoice_number || `Faktura ${inv.id.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {formatDate(inv.invoice_date)}
                            {inv.due_date && ` — forfall ${formatDate(inv.due_date)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                            {formatCurrency(inv.invoiced_amount)}
                          </p>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                              inv.payment_status === 'paid'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : inv.payment_status === 'partial'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {inv.payment_status === 'paid'
                              ? 'Betald'
                              : inv.payment_status === 'partial'
                              ? 'Delbetalad'
                              : 'Obetald'}
                          </span>
                        </div>
                      </div>
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
