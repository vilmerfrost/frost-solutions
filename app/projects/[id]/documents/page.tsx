'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import Sidebar from '@/components/Sidebar'
import { BSAB_FOLDERS, isRestrictedFolder } from '@/lib/documents/folders'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface ChecklistItem extends DocItem {
  uploaded: boolean
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
  blueprint: '\u{1F4D0}',
  'file-text': '\u{1F4C4}',
  folder: '\u{1F4C1}',
  'file-lock': '\u{1F512}',
  banknote: '\u{1F4B5}',
  camera: '\u{1F4F7}',
  'shield-check': '\u{1F6E1}',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DocumentBrowserPage() {
  const params = useParams()
  const projectId = params.id as string
  const { tenantId } = useTenant()

  const [activeFolder, setActiveFolder] = useState<string>(BSAB_FOLDERS[0].key)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [docs, setDocs] = useState<DocItem[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<DocItem[] | null>(null)

  // File actions
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [versionsModal, setVersionsModal] = useState<{ docId: string; versions: VersionEntry[] } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ---------- load folder documents ---------- */

  const loadDocs = useCallback(async () => {
    if (!tenantId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ success: boolean; data: DocItem[] }>(`/api/projects/${projectId}/documents?folder=${activeFolder}`)
      setDocs(res.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda dokument')
    } finally {
      setLoading(false)
    }
  }, [tenantId, projectId, activeFolder])

  const loadChecklist = useCallback(async () => {
    if (!tenantId || !projectId) return
    try {
      const res = await apiFetch<{ success: boolean; data: ChecklistItem[] }>(`/api/projects/${projectId}/documents/checklist`)
      setChecklist(res.data || [])
    } catch {
      // non-critical
    }
  }, [tenantId, projectId])

  useEffect(() => { loadDocs() }, [loadDocs])
  useEffect(() => { loadChecklist() }, [loadChecklist])

  /* ---------- search ---------- */

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: DocItem[] }>(`/api/projects/${projectId}/documents/search?q=${encodeURIComponent(search)}`)
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
        formData.append('folder', activeFolder)

        await fetch(`/api/projects/${projectId}/documents/upload`, {
          method: 'POST',
          body: formData,
        })
      }
      await loadDocs()
      await loadChecklist()
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
      const result = await apiFetch<{ success: boolean; data: { share_url: string } }>(`/api/projects/${projectId}/documents/share`, {
        method: 'POST',
        body: JSON.stringify({ folder: activeFolder }),
      })
      await navigator.clipboard.writeText(result.data.share_url)
      alert('Delningslänk kopierad!')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Kunde inte skapa delningslänk')
    }
  }

  async function loadVersions(docId: string) {
    try {
      const res = await apiFetch<{ success: boolean; data: VersionEntry[] }>(`/api/projects/${projectId}/documents/${docId}/versions`)
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
      await loadChecklist()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Kunde inte ta bort dokument')
    }
    setMenuOpen(null)
  }

  /* ---------- folder tree helpers ---------- */

  function toggleExpand(key: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const activeFolderConfig = BSAB_FOLDERS.find(f => f.key === activeFolder) ||
    BSAB_FOLDERS.flatMap(f => ('subfolders' in f && f.subfolders ? f.subfolders.map(s => ({ key: `${f.key}/${s}`, name: s, parentKey: f.key })) : [])).find(s => s.key === activeFolder)
  const folderLabel = activeFolderConfig?.name || activeFolder

  // Checklist progress
  const requiredTotal = checklist.length
  const requiredUploaded = checklist.filter(c => c.uploaded).length

  const displayDocs = searchResults !== null ? searchResults : docs

  // Missing required docs for current folder
  const missingRequired = checklist.filter(c => !c.uploaded && c.folder === activeFolder)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-0px)]">
          {/* ---- Left pane: Folder tree ---- */}
          <div className="w-full lg:w-60 flex-shrink-0 border-r border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">BSAB Mappar</h2>
              <nav className="space-y-0.5">
                {BSAB_FOLDERS.map((folder) => {
                  const hasChildren = 'subfolders' in folder && folder.subfolders && folder.subfolders.length > 0
                  const isExpanded = expandedFolders.has(folder.key)
                  const isActive = activeFolder === folder.key
                  const restricted = isRestrictedFolder(folder.key)

                  return (
                    <div key={folder.key}>
                      <button
                        onClick={() => {
                          setActiveFolder(folder.key)
                          setSearch('')
                          if (hasChildren) toggleExpand(folder.key)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-l-3 border-amber-500 font-semibold'
                            : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                        }`}
                      >
                        <span>{folderIcons[folder.icon] || '\u{1F4C1}'}</span>
                        <span className="flex-1 text-left">{folder.name}</span>
                        {restricted && (
                          <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                        )}
                        {hasChildren && (
                          <span className="text-stone-400 text-xs">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                        )}
                      </button>

                      {/* Subfolders */}
                      {hasChildren && isExpanded && (
                        <div className="ml-6 space-y-0.5 mt-0.5">
                          {folder.subfolders!.map((sub) => {
                            const subKey = `${folder.key}/${sub}`
                            const subActive = activeFolder === subKey
                            return (
                              <button
                                key={subKey}
                                onClick={() => { setActiveFolder(subKey); setSearch('') }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                                  subActive
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold'
                                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700'
                                }`}
                              >
                                {sub}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>

              {/* Required docs progress */}
              {requiredTotal > 0 && (
                <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-700">
                  <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2">Obligatoriska dokument</h3>
                  <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 mb-1">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${(requiredUploaded / requiredTotal) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {requiredUploaded}/{requiredTotal} uppladdade
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ---- Right pane: File list ---- */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Breadcrumb */}
            <div className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              <span>Dokument</span>
              <span className="mx-2">/</span>
              <span className="text-stone-900 dark:text-white font-medium">{folderLabel}</span>
            </div>

            {/* Action bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <input
                type="text"
                placeholder="Sök dokument..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold hover:bg-stone-100 dark:hover:bg-stone-700 transition-all"
                >
                  Dela mapp
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900 px-5 py-2.5 rounded-lg font-bold shadow-md hover:shadow-xl transition-all text-sm whitespace-nowrap disabled:opacity-50"
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
                  <div key={i} className="h-16 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Missing required docs */}
                {missingRequired.length > 0 && searchResults === null && (
                  <div className="space-y-2 mb-4">
                    {missingRequired.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/10"
                      >
                        <span className="text-orange-500 text-lg">{'\u26A0\uFE0F'}</span>
                        <span className="flex-1 text-sm text-orange-700 dark:text-orange-300 font-medium">
                          {req.file_name}
                        </span>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                          SAKNAS
                        </span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 underline"
                        >
                          Ladda upp
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File list */}
                {displayDocs.length > 0 ? (
                  <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-700">
                    {displayDocs.map((doc) => {
                      const icon = fileIcon(doc.file_name)
                      return (
                        <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors relative">
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
                                  <span key={i} className="text-[10px] text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded">
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
                                <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 py-1">
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
                ) : !loading && searchResults === null && missingRequired.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 dark:text-stone-500">
                    <p className="text-lg mb-2">Inga dokument i denna mapp</p>
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
                  className={`mt-6 border-2 border-dashed rounded-lg py-8 text-center transition-all ${
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
          </div>
        </div>
      </main>

      {/* ---- Versions modal ---- */}
      {versionsModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setVersionsModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Versionshistorik</h2>
                <button onClick={() => setVersionsModal(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-2xl leading-none">&times;</button>
              </div>
              {versionsModal.versions.length > 0 ? (
                <div className="space-y-2">
                  {versionsModal.versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900 text-sm">
                      <span className="font-semibold text-stone-900 dark:text-white">v{v.version}</span>
                      <span className="text-stone-400 dark:text-stone-500">{fileSize(v.file_size)}</span>
                      <span className="text-stone-400 dark:text-stone-500">{new Date(v.created_at).toLocaleDateString('sv-SE')}</span>
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
    </div>
  )
}
