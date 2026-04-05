'use client'

import { useEffect, useState, useRef, FormEvent, use } from 'react'
import { useRouter } from 'next/navigation'
import { portalFetch, getPortalToken, getPortalUser } from '../../lib/portal-client-auth'

/* ────────── Types ────────── */

interface ProjectDetail {
  id: string
  name: string
  status: string
  start_date?: string
  estimated_end_date?: string
  description?: string
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  folder: string
  file_name: string
  file_size: number
  mime_type: string
  version: number
  created_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: string
  due_date: string
  created_at: string
}

interface Message {
  id: string
  sender_type: 'customer' | 'employee'
  sender_name: string
  message: string
  created_at: string
  read_at: string | null
}

interface DailyLog {
  id: string
  log_date: string
  summary: string
  weather?: string
  temperature_c?: number
  workers_on_site?: number
  work_performed?: string
  materials_used?: string
  issues?: string
  photos?: string[]
  created_at: string
}

interface ProjectData {
  project: ProjectDetail
  documents: Document[]
  invoices: Invoice[]
  daily_logs: DailyLog[]
}

/* ────────── Helpers ────────── */

type Tab = 'overview' | 'documents' | 'messages' | 'diary' | 'invoices'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Oversikt' },
  { key: 'documents', label: 'Dokument' },
  { key: 'messages', label: 'Meddelanden' },
  { key: 'diary', label: 'Dagbok' },
  { key: 'invoices', label: 'Fakturor' },
]

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planering',
  in_progress: 'Pagaende',
  completed: 'Avslutad',
  on_hold: 'Pausad',
  cancelled: 'Avbruten',
}

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Utkast', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  sent: { label: 'Skickad', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  overdue: { label: 'Forfallen', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  paid: { label: 'Betald', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'Makulerad', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount)
}

/* ────────── Component ────────── */

export default function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<ProjectData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Message input
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Paying invoice
  const [payingId, setPayingId] = useState<string | null>(null)

  const user = getPortalUser()

  useEffect(() => {
    const token = getPortalToken()
    if (!token) {
      router.push('/portal/login')
      return
    }
    portalFetch<{ data: ProjectData }>(`/portal/projects/${projectId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [projectId, router])

  // Load messages when switching to messages tab
  useEffect(() => {
    if (tab === 'messages') {
      portalFetch<{ data: Message[] }>(`/portal/projects/${projectId}/messages`)
        .then((res) => setMessages(res.data))
        .catch(() => {})
    }
  }, [tab, projectId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!msgText.trim()) return
    setSending(true)
    try {
      const res = await portalFetch<{ data: Message }>(`/portal/projects/${projectId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: msgText.trim() }),
      })
      setMessages((prev) => [...prev, res.data])
      setMsgText('')
    } catch {
      // Silently fail — user can retry
    } finally {
      setSending(false)
    }
  }

  async function handlePayInvoice(invoiceId: string) {
    setPayingId(invoiceId)
    try {
      const res = await portalFetch<{ data: { checkout_url: string } }>(`/portal/invoices/${invoiceId}/pay`, {
        method: 'POST',
      })
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url
      }
    } catch {
      setPayingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
        {error ?? 'Projektet kunde inte laddas'}
      </div>
    )
  }

  const { project, documents, invoices, daily_logs } = data

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal/dashboard')}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {STATUS_LABELS[project.status] ?? project.status}
          </p>
        </div>
        {project.status === 'completed' && (
          <button
            onClick={() => router.push(`/portal/projects/${projectId}/survey`)}
            className="ml-auto text-sm px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Lamna omdome
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Projektstatus</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</span>
                <p className="font-medium text-gray-900 dark:text-white mt-1">
                  {STATUS_LABELS[project.status] ?? project.status}
                </p>
              </div>
              {project.start_date && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Startdatum</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {new Date(project.start_date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              )}
              {project.estimated_end_date && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Beraknat slutdatum</span>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {new Date(project.estimated_end_date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              )}
            </div>
            {project.description && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{project.description}</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dokument</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{documents.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fakturor</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{invoices.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dagboksnoteringar</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{daily_logs.length}</p>
            </div>
          </div>

          {/* Recent activity */}
          {daily_logs.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Senaste aktivitet</h2>
              <div className="space-y-3">
                {daily_logs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                      {new Date(log.log_date).toLocaleDateString('sv-SE')}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">{log.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Inga dokument tillgangliga
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Filnamn</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Mapp</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Storlek</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Datum</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {doc.file_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{doc.folder}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{formatBytes(doc.file_size)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString('sv-SE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col" style={{ height: '500px' }}>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                Inga meddelanden an. Skriv ditt forsta meddelande nedan.
              </div>
            )}
            {messages.map((msg) => {
              const isCustomer = msg.sender_type === 'customer'
              return (
                <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
                      isCustomer
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                    }`}
                  >
                    {!isCustomer && (
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {msg.sender_name}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCustomer ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleString('sv-SE', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
            <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Skriv ett meddelande..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={sending || !msgText.trim()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sending ? '...' : 'Skicka'}
            </button>
          </form>
        </div>
      )}

      {tab === 'diary' && (
        <div className="space-y-4">
          {daily_logs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
              Inga dagboksnoteringar an
            </div>
          ) : (
            daily_logs.map((log) => (
              <div key={log.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {new Date(log.log_date).toLocaleDateString('sv-SE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {log.weather && <span>{log.weather}</span>}
                    {log.temperature_c != null && <span>{log.temperature_c}&deg;C</span>}
                    {log.workers_on_site != null && (
                      <span>{log.workers_on_site} arbetare</span>
                    )}
                  </div>
                </div>

                {log.summary && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{log.summary}</p>
                )}

                {log.work_performed && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Utfort arbete
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                      {log.work_performed}
                    </p>
                  </div>
                )}

                {log.materials_used && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Material
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{log.materials_used}</p>
                  </div>
                )}

                {log.issues && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-red-500 dark:text-red-400 uppercase tracking-wide">
                      Problem/Avvikelser
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{log.issues}</p>
                  </div>
                )}

                {log.photos && log.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {log.photos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Inga fakturor an
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Faktura</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Belopp</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Forfallodatum</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const st = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.draft
                  return (
                    <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{formatCurrency(inv.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {new Date(inv.due_date).toLocaleDateString('sv-SE')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(inv.status === 'sent' || inv.status === 'overdue') && (
                          <button
                            onClick={() => handlePayInvoice(inv.id)}
                            disabled={payingId === inv.id}
                            className="text-xs font-medium px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                          >
                            {payingId === inv.id ? 'Laddar...' : 'Betala'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
