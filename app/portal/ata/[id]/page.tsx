'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { portalFetch, getPortalToken } from '../../lib/portal-client-auth'

interface AtaDetail {
  id: string
  description: string
  type: string
  amount?: number
  labor_cost?: number
  material_cost?: number
  photos?: string[]
  customer_approval_status: string | null
  status_timeline?: { status: string; timestamp: string; user_id?: string }[]
  created_at: string
}

const ATA_TYPE_LABELS: Record<string, string> = {
  addition: 'Tillagg',
  deduction: 'Avdrag',
  change: 'Andring',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount)
}

export default function PortalAtaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ataId } = use(params)
  const router = useRouter()
  const [ata, setAta] = useState<AtaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [result, setResult] = useState<{ approved: boolean } | null>(null)

  useEffect(() => {
    const token = getPortalToken()
    if (!token) {
      router.push('/portal/login')
      return
    }

    // We don't have a dedicated GET endpoint for single ATA in the portal API,
    // so we use the approve endpoint info. For now, just show the page with
    // the ATA ID and allow approval/rejection actions.
    // In a full implementation, there would be a GET /api/portal/ata/[id] route.
    setLoading(false)
  }, [ataId, router])

  async function handleApprove() {
    setActionLoading(true)
    setError(null)
    try {
      await portalFetch(`/portal/ata/${ataId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          approved: true,
          bankid_reference: `BANKID-${Date.now()}`, // Placeholder — real BankID integration needed
        }),
      })
      setResult({ approved: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nagot gick fel')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    setError(null)
    try {
      await portalFetch(`/portal/ata/${ataId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          approved: false,
          rejected_reason: rejectReason.trim(),
        }),
      })
      setResult({ approved: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nagot gick fel')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Success state
  if (result) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
          result.approved ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          {result.approved ? (
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {result.approved ? 'ATA godkand' : 'ATA avvisad'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {result.approved
            ? 'Du har godkant detta ATA-arende. Entreprenoren har meddelats.'
            : 'Du har avvisat detta ATA-arende. Entreprenoren har meddelats.'}
        </p>
        <button
          onClick={() => router.push('/portal/dashboard')}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          Tillbaka till mina projekt
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tillbaka
      </button>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          ATA-arende
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Granska detaljerna och godkann eller avvisa nedan.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          ATA-ID: <span className="font-mono text-gray-700 dark:text-gray-300">{ataId}</span>
        </div>

        {/* Actions */}
        {!showRejectForm ? (
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-center"
            >
              {actionLoading ? 'Behandlar...' : 'Godkann med BankID'}
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={actionLoading}
              className="flex-1 py-3 px-6 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition-colors text-center"
            >
              Avvisa
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Anledning till avvisning
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
              placeholder="Beskriv varfor du avvisar detta ATA-arende..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
              >
                {actionLoading ? 'Behandlar...' : 'Bekrafta avvisning'}
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectReason('')
                }}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
