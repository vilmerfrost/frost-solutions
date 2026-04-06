'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { portalFetch, getPortalToken } from '../../lib/portal-client-auth'

interface AtaDetail {
  id: string
  description: string
  ata_type: string
  urgency: string
  work_type: string
  work_cost_sek: number
  material_cost_sek: number
  total_cost_sek: number
  cost_frame: number | null
  photos: string[]
  customer_approval_status: string | null
  status_timeline: { status: string; timestamp: string; user_id?: string }[]
  created_at: string
  project_name: string
}

const ATA_TYPE_LABELS: Record<string, string> = {
  addition: 'Tillägg',
  deduction: 'Avdrag',
  change: 'Ändring',
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

    async function fetchAta() {
      try {
        const res = await portalFetch<{ data: AtaDetail }>(`/portal/ata/${ataId}`)
        setAta(res.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunde inte hämta ÄTA-detaljer')
      } finally {
        setLoading(false)
      }
    }

    fetchAta()
  }, [ataId, router])

  async function handleApprove() {
    setActionLoading(true)
    setError(null)
    try {
      // TODO: BankID signing integration pending — requires a portal-accessible
      // signing endpoint. The current /api/signing/create requires Supabase auth
      // which portal users don't have.
      await portalFetch(`/portal/ata/${ataId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          approved: true,
        }),
      })
      setResult({ approved: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
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
      setError(err instanceof Error ? err.message : 'Något gick fel')
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
          {result.approved ? 'ÄTA godkänd' : 'ÄTA avvisad'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {result.approved
            ? 'Du har godkänt detta ÄTA-ärende. Entreprenören har meddelats.'
            : 'Du har avvisat detta ÄTA-ärende. Entreprenören har meddelats.'}
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
          ÄTA-ärende
        </h1>
        {ata?.project_name && (
          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">
            {ata.project_name}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Granska detaljerna och godkänn eller avvisa nedan.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {ata && (
          <div className="space-y-5 mb-8">
            {/* Status badge */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                ata.customer_approval_status === 'approved'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : ata.customer_approval_status === 'rejected'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {ata.customer_approval_status === 'approved' ? 'Godkänd'
                  : ata.customer_approval_status === 'rejected' ? 'Avvisad'
                  : 'Väntar på godkännande'}
              </span>
              {ata.ata_type && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {ATA_TYPE_LABELS[ata.ata_type] ?? ata.ata_type}
                </span>
              )}
              {ata.urgency && ata.urgency !== 'normal' && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  ata.urgency === 'critical'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                }`}>
                  {ata.urgency === 'critical' ? 'Kritisk' : 'Brådskande'}
                </span>
              )}
            </div>

            {/* Description */}
            {ata.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Beskrivning</h3>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{ata.description}</p>
              </div>
            )}

            {/* Cost details */}
            <div className="grid grid-cols-2 gap-4">
              {ata.work_cost_sek > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Arbetskostnad</h3>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(Number(ata.work_cost_sek))}</p>
                </div>
              )}
              {ata.material_cost_sek > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Materialkostnad</h3>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(Number(ata.material_cost_sek))}</p>
                </div>
              )}
              {ata.total_cost_sek > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Totalkostnad</h3>
                  <p className="text-lg text-gray-900 dark:text-white font-bold">{formatCurrency(Number(ata.total_cost_sek))}</p>
                </div>
              )}
              {ata.cost_frame != null && ata.cost_frame > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Kostnadsram</h3>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(Number(ata.cost_frame))}</p>
                </div>
              )}
            </div>

            {/* Photos */}
            {ata.photos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bilder ({ata.photos.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ata.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={url}
                        alt={`ATA-bild ${i + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span>Skapad: {new Date(ata.created_at).toLocaleDateString('sv-SE')}</span>
              <span className="font-mono">ID: {ata.id.slice(0, 8)}</span>
            </div>
          </div>
        )}

        {!ata && !error && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            ATA-ID: <span className="font-mono text-gray-700 dark:text-gray-300">{ataId}</span>
          </div>
        )}

        {/* Actions — only show if not already decided */}
        {ata?.customer_approval_status !== 'approved' && ata?.customer_approval_status !== 'rejected' && (
          <>
            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-center"
                >
                  {actionLoading ? 'Behandlar...' : 'Godkänn'}
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
                  placeholder="Beskriv varför du avvisar detta ÄTA-ärende..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
                  >
                    {actionLoading ? 'Behandlar...' : 'Bekräfta avvisning'}
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
          </>
        )}

        {/* Already decided message */}
        {(ata?.customer_approval_status === 'approved' || ata?.customer_approval_status === 'rejected') && (
          <div className={`p-4 rounded-lg text-sm font-medium ${
            ata.customer_approval_status === 'approved'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {ata.customer_approval_status === 'approved'
              ? 'Detta ÄTA-ärende har redan godkänts.'
              : 'Detta ÄTA-ärende har redan avvisats.'}
          </div>
        )}
      </div>
    </div>
  )
}
