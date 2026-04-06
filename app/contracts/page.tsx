'use client'

import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import {
  PenTool,
  Scale,
  HardHat,
  Home,
  ChevronDown,
  Loader2,
  FileSignature,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  FileText,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Template {
  id: string
  name: string
  standard: string
  description: string
  sectionCount: number
}

interface Project {
  id: string
  name: string
}

interface FilledTemplate {
  id: string
  name: string
  standard: string
  sections: Array<{ title: string; body: string }>
}

interface SigningOrder {
  id: string
  idura_order_id?: string
  document_type: string
  document_id: string
  status: string
  created_at: string
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  ab04: <Scale className="w-8 h-8" />,
  abt06: <HardHat className="w-8 h-8" />,
  konsument: <Home className="w-8 h-8" />,
}

function statusBadge(status: string) {
  switch (status) {
    case 'signed':
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" /> Signerad
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <XCircle className="w-3 h-3" /> Avvisad
        </span>
      )
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-900/30 text-stone-700 dark:text-stone-300">
          <AlertCircle className="w-3 h-3" /> Utgangen
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          <Clock className="w-3 h-3" /> Vantar
        </span>
      )
  }
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr))
}

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function ContractsPage() {
  const { tenantId } = useTenant()

  // Template section state
  const [templates, setTemplates] = useState<Template[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<FilledTemplate | null>(null)

  // Signing orders
  const [signingOrders, setSigningOrders] = useState<SigningOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // Fetch templates
  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ success: boolean; data: Template[] }>('/api/contracts/templates')
        setTemplates(res.data ?? [])
      } catch {
        // Templates are static, so this rarely fails
      }
    }
    load()
  }, [])

  // Fetch projects
  useEffect(() => {
    if (!tenantId) return
    async function loadProjects() {
      try {
        const res = await apiFetch<{ projects?: Project[] }>(`/api/projects/list?tenantId=${tenantId}`)
        setProjects(res.projects ?? [])
      } catch { /* silent */ }
    }
    loadProjects()
  }, [tenantId])

  // Fetch signing orders
  const fetchSigningOrders = useCallback(async () => {
    if (!tenantId) return
    setLoadingOrders(true)
    try {
      const res = await apiFetch<{ data?: SigningOrder[] }>('/api/signing/orders')
      setSigningOrders(res.data ?? [])
    } catch {
      // Silent — endpoint may not exist yet
      setSigningOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchSigningOrders()
  }, [fetchSigningOrders])

  // Generate contract
  async function handleGenerate() {
    if (!selectedTemplate || !selectedProject) {
      toast.error('Välj mall och projekt')
      return
    }
    setGenerating(true)
    setPreview(null)
    try {
      const res = await apiFetch<{ success: boolean; data: { template: FilledTemplate } }>(
        '/api/contracts/generate',
        {
          method: 'POST',
          body: JSON.stringify({ templateId: selectedTemplate, projectId: selectedProject }),
        }
      )
      setPreview(res.data.template)
      toast.success('Avtal genererat!')
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte generera avtal')
    } finally {
      setGenerating(false)
    }
  }

  // Sign with BankID — currently disabled, BankID integration is not yet available.
  async function handleSign() {
    // BankID signing is not available yet; show informational toast.
    toast.error('BankID-signering är inte tillgänglig ännu. Kommer snart.')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary-500 rounded-lg shadow-md">
              <PenTool className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Avtal & Signering
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Skapa avtal fran mallar och signera digitalt
              </p>
            </div>
          </div>

          {/* ============ SKAPA AVTAL ============ */}
          <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Skapa avtal
            </h2>

            {/* Template cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {templates.map((t) => {
                const isSelected = selectedTemplate === t.id
                const iconKey = t.id.toLowerCase().replace(/[-_]/g, '')
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                    }`}
                  >
                    <div className={`mb-3 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {TEMPLATE_ICONS[iconKey] || <FileText className="w-8 h-8" />}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {t.description}
                    </p>
                  </button>
                )
              })}
              {templates.length === 0 && (
                <>
                  {/* Fallback static cards when API hasn't loaded */}
                  {[
                    { id: 'ab04', name: 'AB 04', desc: 'Allm. bestammelser for byggnads-, anlaggnings- och installationsentreprenader' },
                    { id: 'abt06', name: 'ABT 06', desc: 'Allm. bestammelser for totalentreprenader' },
                    { id: 'konsument', name: 'Konsument', desc: 'Konsumenttjanstlagen — smarre reparations- och ombyggnadsjobb' },
                  ].map((t) => {
                    const isSelected = selectedTemplate === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className={`mb-3 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                          {TEMPLATE_ICONS[t.id] || <FileText className="w-8 h-8" />}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t.desc}</p>
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            {/* Project selector + generate button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Valj projekt...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={handleGenerate}
                disabled={!selectedTemplate || !selectedProject || generating}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-semibold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                Generera avtal
              </button>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-6">
                <div className="bg-stone-50 dark:bg-stone-900/20 rounded-xl border border-stone-200 dark:border-stone-700 p-6 max-h-[400px] overflow-y-auto">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {preview.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                    {preview.standard}
                  </p>
                  {preview.sections?.map((sec, i) => (
                    <div key={i} className="mb-4">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">
                        {sec.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                        {sec.body}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSign}
                    disabled={true}
                    title="Kommer snart — BankID-signering är inte tillgänglig ännu"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FileSignature className="w-4 h-4" />
                    Signera med BankID (kommer snart)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============ AKTIVA SIGNERINGAR ============ */}
          <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Aktiva signeringar
              </h2>
            </div>

            {loadingOrders ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
              </div>
            ) : signingOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inga signeringsordrar annu</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-3">Dokument</th>
                      <th className="px-6 py-3">Typ</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Skapad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {signingOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                          {order.document_type}-{order.document_id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400 capitalize">
                          {order.document_type === 'contract'
                            ? 'Avtal'
                            : order.document_type === 'quote'
                            ? 'Offert'
                            : order.document_type === 'invoice'
                            ? 'Faktura'
                            : order.document_type}
                        </td>
                        <td className="px-6 py-3">{statusBadge(order.status)}</td>
                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
