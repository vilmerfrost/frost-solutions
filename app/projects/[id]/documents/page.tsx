'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import Sidebar from '@/components/Sidebar'
import { canAccessTab } from '@/lib/binders/permissions'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BinderTab {
  id: string
  name: string
  config: { restricted_roles?: string[] }
  sort_order: number
}

interface Binder {
  id: string
  name: string
  icon: string | null
  binder_tabs: BinderTab[]
}

interface BinderTemplate {
  id: string
  name: string
}

interface DocItem {
  id: string
  folder: string
  file_name: string
  file_path: string | null
  file_size: number | null
  mime_type: string | null
  description: string | null
  tags: string[]
  is_required: boolean
  version: number | null
  created_at: string
  uploaded_by: string | null
}

interface VersionEntry {
  id: string
  version: number
  file_path: string
  file_size: number | null
  created_at: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext || '')) return 'PDF'
  if (['dwg', 'dxf'].includes(ext || '')) return 'DWG'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'IMG'
  if (['doc', 'docx'].includes(ext || '')) return 'DOC'
  if (['xls', 'xlsx'].includes(ext || '')) return 'XLS'
  return 'FIL'
}

function iconColor(label: string): string {
  switch (label) {
    case 'PDF': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    case 'DWG': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'IMG': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    case 'DOC': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
    case 'XLS': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    default: return 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300'
  }
}

const folderIcons: Record<string, string> = {
  blueprint: '📐',
  'file-text': '📄',
  folder: '📁',
  'file-lock': '🔒',
  banknote: '💵',
  camera: '📷',
  'shield-check': '🛡',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DocumentBrowserPage() {
  const params = useParams()
  const projectId = params.id as string
  const { tenantId } = useTenant()
  const { role } = useAdmin()

  // Binder state
  const [binders, setBinders] = useState<Binder[]>([])
  const [activeBinder, setActiveBinder] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [expandedBinders, setExpandedBinders] = useState<Set<string>>(new Set())
  const [bindersLoading, setBindersLoading] = useState(true)

  // Create binder modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBinderName, setNewBinderName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [binderTemplates, setBinderTemplates] = useState<BinderTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  // Document state
  const [docs, setDocs] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<DocItem[] | null>(null)

  // File actions
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [versionsModal, setVersionsModal] = useState<{ docId: string; versions: VersionEntry[] } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ---------- load binders ---------- */

  const loadBinders = useCallback(async () => {
    if (!tenantId || !projectId) return
    setBindersLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: Binder[] }>(`/api/projects/${projectId}/binders`)
      const data = res.data || []
      setBinders(data)
      // Auto-select first accessible tab
      if (data.length > 0 && !activeBinder) {
        const firstBinder = data[0]
        setActiveBinder(firstBinder.id)
        setExpandedBinders(new Set([firstBinder.id]))
        const accessibleTab = firstBinder.binder_tabs?.find(t => canAccessTab(role, t.config))
        if (accessibleTab) setActiveTab(accessibleTab.id)
      }
    } catch {
      // non-critical; binders may not exist yet
    } finally {
      setBindersLoading(false)
    }
  }, [tenantId, projectId]) // intentionally omitting activeBinder/role to avoid re-fetching on every role change

  useEffect(() => { loadBinders() }, [loadBinders])

  /* ---------- load documents for active tab ---------- */

  const loadDocs = useCallback(async () => {
    if (!tenantId || !projectId || !activeTab) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ success: boolean; data: DocItem[] }>(
        `/api/projects/${projectId}/documents?binder_tab_id=${activeTab}`
      )
      setDocs(res.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda dokument')
    } finally {
      setLoading(false)
    }
  }, [tenantId, projectId, activeTab])

  useEffect(() => { loadDocs() }, [loadDocs])

  /* ---------- search ---------- */

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: DocItem[] }>(
          `/api/projects/${projectId}/documents/search?q=${encodeURIComponent(search)}`
        )
        setSearchResults(res.data || [])
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, projectId])

  /* ---------- upload ---------- */

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        if (activeTab) formData.append('binder_tab_id', activeTab)

        await fetch(`/api/projects/${projectId}/documents/upload`, {
          method: 'POST',
          body: formData,
        })
      }
      await loadDocs()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Uppladdning misslyckades')
    } finally {
      setUploading(false)
      setDragOver(false)
    }
  }

  /* ---------- file actions ---------- */

  async function handleAutoTag(docId: string) {
    try {
      await apiFetch(`/api/projects/${projectId}/documents/${docId}/auto-tag`, { method: 'POST' })
      await loadDocs()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'AI-taggning misslyckades')
    }
    setMenuOpen(null)
  }

  async function handleShare() {
    try {
      const result = await apiFetch<{ success: boolean; data: { share_url: string } }>(
        `/api/projects/${projectId}/documents/share`,
        { method: 'POST', body: JSON.stringify({ binder_tab_id: activeTab }) }
      )
      await navigator.clipboard.writeText(result.data.share_url)
      alert('Delningslänk kopierad!')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Kunde inte skapa delningslänk')
    }
  }

  async function loadVersions(docId: string) {
    try {
      const res = await apiFetch<{ success: boolean; data: VersionEntry[] }>(
        `/api/projects/${projectId}/documents/${docId}/versions`
      )
      setVersionsModal({ docId, versions: res.data || [] })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Kunde inte hämta versionshistorik')
    }
    setMenuOpen(null)
  }

  async function handleDelete(docId: string) {
    if (!confirm('Är du säker på att du vill ta bort detta dokument?')) return
    try {
      await apiFetch(`/api/projects/${projectId}/documents/${docId}`, { method: 'DELETE' })
      await loadDocs()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Kunde inte ta bort dokument')
    }
    setMenuOpen(null)
  }

  /* ---------- binder navigation helpers ---------- */

  function toggleBinder(binderId: string) {
    setExpandedBinders(prev => {
      const next = new Set(prev)
      if (next.has(binderId)) next.delete(binderId)
      else next.add(binderId)
      return next
    })
  }

  function selectTab(binderId: string, tabId: string) {
    setActiveBinder(binderId)
    setActiveTab(tabId)
    setSearch('')
    setSearchResults(null)
    if (!expandedBinders.has(binderId)) {
      setExpandedBinders(prev => new Set([...prev, binderId]))
    }
  }

  /* ---------- create binder ---------- */

  async function openCreateModal() {
    setShowCreateModal(true)
    setNewBinderName('')
    setSelectedTemplate('')
    setTemplatesLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: BinderTemplate[] }>('/api/templates/binders')
      setBinderTemplates(res.data || [])
    } catch {
      setBinderTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }

  async function handleCreateBinder() {
    if (!newBinderName.trim()) return
    setCreating(true)
    try {
      await apiFetch(`/api/projects/${projectId}/binders`, {
        method: 'POST',
        body: JSON.stringify({
          name: newBinderName.trim(),
          template_id: selectedTemplate || undefined,
        }),
      })
      setShowCreateModal(false)
      await loadBinders()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Kunde inte skapa pärm')
    } finally {
      setCreating(false)
    }
  }

  /* ---------- derived values ---------- */

  const activeTabConfig = binders
    .flatMap(b => b.binder_tabs || [])
    .find(t => t.id === activeTab)

  const displayDocs = searchResults !== null ? searchResults : docs

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-0px)]">

          {/* ---- Left pane: Binder list ---- */}
          <div className="w-full lg:w-64 flex-shrink-0 border-r border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Pärmar</h2>
                <button
                  onClick={openCreateModal}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-[8px] transition-all"
                >
                  + Ny pärm
                </button>
              </div>

              {bindersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-9 bg-stone-100 dark:bg-stone-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : binders.length === 0 ? (
                <div className="text-center py-8 text-stone-400 dark:text-stone-500">
                  <p className="text-sm mb-3">Inga pärmar ännu</p>
                  <button
                    onClick={openCreateModal}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Skapa första pärmen
                  </button>
                </div>
              ) : (
                <nav className="space-y-0.5">
                  {binders.map((binder) => {
                    const isExpanded = expandedBinders.has(binder.id)
                    const isBinderActive = activeBinder === binder.id
                    const tabs = (binder.binder_tabs || [])
                      .filter(t => canAccessTab(role, t.config))
                      .sort((a, b) => a.sort_order - b.sort_order)

                    return (
                      <div key={binder.id}>
                        <button
                          onClick={() => {
                            toggleBinder(binder.id)
                            if (!activeBinder || activeBinder !== binder.id) {
                              setActiveBinder(binder.id)
                              const firstTab = tabs[0]
                              if (firstTab) setActiveTab(firstTab.id)
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm transition-all ${
                            isBinderActive
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold'
                              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                          }`}
                        >
                          <span>{folderIcons[binder.icon || 'folder'] || '📁'}</span>
                          <span className="flex-1 text-left truncate">{binder.name}</span>
                          <span className="text-stone-400 text-xs flex-shrink-0">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </button>

                        {/* Tabs */}
                        {isExpanded && tabs.length > 0 && (
                          <div className="ml-5 mt-0.5 space-y-0.5">
                            {tabs.map((tab) => {
                              const isTabActive = activeTab === tab.id
                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => selectTab(binder.id, tab.id)}
                                  className={`w-full text-left px-3 py-1.5 rounded-[8px] text-sm transition-all ${
                                    isTabActive
                                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-l-2 border-amber-500 font-semibold'
                                      : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700'
                                  }`}
                                >
                                  {tab.name}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {isExpanded && tabs.length === 0 && (
                          <p className="ml-5 mt-1 mb-1 text-xs text-stone-400 dark:text-stone-500 px-3 py-1">
                            Inga flikar
                          </p>
                        )}
                      </div>
                    )
                  })}
                </nav>
              )}
            </div>
          </div>

          {/* ---- Right pane: Documents ---- */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Breadcrumb */}
            <div className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              <span>Dokument</span>
              {activeTabConfig && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-stone-900 dark:text-white font-medium">{activeTabConfig.name}</span>
                </>
              )}
            </div>

            {!activeTab ? (
              <div className="text-center py-20 text-stone-400 dark:text-stone-500">
                <p className="text-lg mb-2">Välj en flik</p>
                <p className="text-sm">Välj en pärm och flik i menyn till vänster</p>
              </div>
            ) : (
              <>
                {/* Action bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                  <input
                    type="text"
                    placeholder="Sök dokument..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-[8px] border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      className="px-4 py-2.5 rounded-[8px] border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold hover:bg-stone-100 dark:hover:bg-stone-700 transition-all"
                    >
                      Dela flik
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-amber-500 hover:bg-amber-600 text-stone-900 px-5 py-2.5 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm whitespace-nowrap disabled:opacity-50"
                    >
                      {uploading ? 'Laddar upp...' : 'Ladda upp'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="text-center text-stone-500 dark:text-stone-400 py-12">
                    <p className="mb-3">{error}</p>
                    <button onClick={loadDocs} className="text-amber-600 hover:underline font-medium">
                      Försök igen
                    </button>
                  </div>
                )}

                {/* Loading */}
                {loading && !error ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 bg-stone-200 dark:bg-stone-700 rounded-[8px] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* File list */}
                    {displayDocs.length > 0 ? (
                      <div className="bg-white dark:bg-stone-800 rounded-[8px] border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-700">
                        {displayDocs.map((doc) => {
                          const icon = fileIcon(doc.file_name)
                          return (
                            <div
                              key={doc.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors relative"
                            >
                              {/* Icon */}
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${iconColor(icon)}`}>
                                {icon}
                              </div>

                              {/* Name + tags */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                                  {doc.file_name}
                                </p>
                                {doc.tags && doc.tags.length > 0 && (
                                  <div className="flex gap-1 mt-0.5 flex-wrap">
                                    {doc.tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Version */}
                              {doc.version && (
                                <span className="text-xs text-stone-400 dark:text-stone-500 font-medium hidden sm:block">
                                  v{doc.version}
                                </span>
                              )}

                              {/* Size */}
                              <span className="text-xs text-stone-400 dark:text-stone-500 w-16 text-right hidden sm:block">
                                {fileSize(doc.file_size)}
                              </span>

                              {/* Date */}
                              <span className="text-xs text-stone-400 dark:text-stone-500 w-20 text-right hidden sm:block">
                                {new Date(doc.created_at).toLocaleDateString('sv-SE')}
                              </span>

                              {/* Actions menu */}
                              <div className="relative">
                                <button
                                  onClick={() => setMenuOpen(menuOpen === doc.id ? null : doc.id)}
                                  className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                >
                                  <span className="text-lg leading-none">&middot;&middot;&middot;</span>
                                </button>
                                {menuOpen === doc.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                    <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-stone-800 rounded-[8px] shadow-xl border border-stone-200 dark:border-stone-700 py-1">
                                      {doc.file_path && (
                                        <a
                                          href={doc.file_path}
                                          download
                                          className="block px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                                          onClick={() => setMenuOpen(null)}
                                        >
                                          Ladda ner
                                        </a>
                                      )}
                                      <button
                                        onClick={() => loadVersions(doc.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                                      >
                                        Versionshistorik
                                      </button>
                                      <button
                                        onClick={() => { handleShare(); setMenuOpen(null) }}
                                        className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                                      >
                                        Dela
                                      </button>
                                      <button
                                        onClick={() => handleAutoTag(doc.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                                      >
                                        AI-tagga
                                      </button>
                                      <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      >
                                        Ta bort
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : !loading && searchResults === null ? (
                      <div className="text-center py-16 text-stone-400 dark:text-stone-500">
                        <p className="text-lg mb-2">Inga dokument i denna flik</p>
                        <p className="text-sm">Ladda upp filer eller dra och släpp nedan</p>
                      </div>
                    ) : searchResults !== null && searchResults.length === 0 ? (
                      <div className="text-center py-16 text-stone-400 dark:text-stone-500">
                        <p>Inga resultat för &quot;{search}&quot;</p>
                      </div>
                    ) : null}

                    {/* Drag-drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
                      className={`mt-6 border-2 border-dashed rounded-[8px] py-8 text-center transition-all ${
                        dragOver
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      <p className="text-sm text-stone-400 dark:text-stone-500">
                        {dragOver ? 'Släpp filer här...' : 'Dra och släpp filer här'}
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ---- Versions modal ---- */}
      {versionsModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setVersionsModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Versionshistorik</h2>
                <button
                  onClick={() => setVersionsModal(null)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              {versionsModal.versions.length > 0 ? (
                <div className="space-y-2">
                  {versionsModal.versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-stone-50 dark:bg-stone-900 text-sm"
                    >
                      <span className="font-semibold text-stone-900 dark:text-white">v{v.version}</span>
                      <span className="text-stone-400 dark:text-stone-500">{fileSize(v.file_size)}</span>
                      <span className="text-stone-400 dark:text-stone-500">
                        {new Date(v.created_at).toLocaleDateString('sv-SE')}
                      </span>
                      {v.file_path && (
                        <a href={v.file_path} download className="text-amber-600 hover:underline text-xs font-medium">
                          Ladda ner
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-4">Inga tidigare versioner</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---- Create binder modal ---- */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowCreateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-800 rounded-[8px] shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Ny pärm</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Namn
                  </label>
                  <input
                    type="text"
                    value={newBinderName}
                    onChange={(e) => setNewBinderName(e.target.value)}
                    placeholder="T.ex. Ritningar, Kontrakt..."
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBinder()}
                    className="w-full px-4 py-2.5 rounded-[8px] border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Från mall <span className="text-stone-400 font-normal">(valfritt)</span>
                  </label>
                  {templatesLoading ? (
                    <div className="h-10 bg-stone-100 dark:bg-stone-700 rounded-[8px] animate-pulse" />
                  ) : (
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-[8px] border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Ingen mall</option>
                      {binderTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-[8px] border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition-all"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleCreateBinder}
                  disabled={creating || !newBinderName.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900 px-5 py-2.5 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all text-sm disabled:opacity-50"
                >
                  {creating ? 'Skapar...' : 'Skapa pärm'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
