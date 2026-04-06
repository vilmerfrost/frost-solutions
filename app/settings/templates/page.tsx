'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import Sidebar from '@/components/Sidebar'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TabDef {
  name: string
  key: string
  icon: string
  restricted: boolean
}

interface BinderTemplate {
  id: string
  name: string
  description: string | null
  structure: { tabs: TabDef[] }
  is_default: boolean
  created_at: string
}

interface ChecklistItem {
  label: string
  type: 'yes_no' | 'measurement' | 'dropdown' | 'text'
  config?: Record<string, unknown>
}

interface ChecklistSection {
  name: string
  items: ChecklistItem[]
}

interface ChecklistTemplate {
  id: string
  name: string
  description: string | null
  category: string | null
  structure: { sections: ChecklistSection[] }
  created_at: string
}

// ─── Icon options ────────────────────────────────────────────────────────────

const ICON_OPTIONS = [
  { value: 'folder', label: 'Mapp' },
  { value: 'file-text', label: 'Dokument' },
  { value: 'blueprint', label: 'Ritning' },
  { value: 'file-lock', label: 'Låst fil' },
  { value: 'banknote', label: 'Ekonomi' },
  { value: 'camera', label: 'Foto' },
  { value: 'shield-check', label: 'KMA' },
  { value: 'wrench', label: 'Verktyg' },
  { value: 'clipboard', label: 'Checklista' },
  { value: 'users', label: 'Personal' },
]

const CHECKLIST_CATEGORIES = [
  { value: 'Grund', label: 'Grund' },
  { value: 'Stomme', label: 'Stomme' },
  { value: 'Tak', label: 'Tak' },
  { value: 'El', label: 'El' },
  { value: 'VVS', label: 'VVS' },
  { value: 'Övrigt', label: 'Övrigt' },
]

const ITEM_TYPES = [
  { value: 'yes_no', label: 'Ja/Nej' },
  { value: 'measurement', label: 'Mätning' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'text', label: 'Text' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function countItems(template: ChecklistTemplate): number {
  return template.structure.sections.reduce((sum, s) => sum + s.items.length, 0)
}

// ─── Binder Template Modal ───────────────────────────────────────────────────

interface BinderModalProps {
  initial: BinderTemplate | null
  onClose: () => void
  onSaved: () => void
}

function BinderTemplateModal({ initial, onClose, onSaved }: BinderModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false)
  const [tabs, setTabs] = useState<TabDef[]>(
    initial?.structure.tabs ?? [{ name: '', key: '', icon: 'folder', restricted: false }]
  )
  const [saving, setSaving] = useState(false)

  function handleTabNameChange(i: number, value: string) {
    setTabs(prev =>
      prev.map((t, idx) =>
        idx === i ? { ...t, name: value, key: slugify(value) } : t
      )
    )
  }

  function handleTabField<K extends keyof TabDef>(i: number, field: K, value: TabDef[K]) {
    setTabs(prev => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)))
  }

  function addTab() {
    setTabs(prev => [...prev, { name: '', key: '', icon: 'folder', restricted: false }])
  }

  function removeTab(i: number) {
    setTabs(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Namn krävs')
      return
    }
    if (tabs.some(t => !t.name.trim())) {
      toast.error('Alla flikar måste ha ett namn')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        structure: { tabs: tabs.map(t => ({ ...t, key: t.key || slugify(t.name) })) },
        isDefault,
      }

      if (initial) {
        await apiFetch(`/api/templates/binders/${initial.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        toast.success('Pärmall uppdaterad')
      } else {
        await apiFetch('/api/templates/binders', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast.success('Pärmall skapad')
      }
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initial ? 'Redigera pärmall' : 'Ny pärmall'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Namn <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="T.ex. BSAB-standard"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Beskrivning
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Valfri beskrivning..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* is_default */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Standardmall (används vid nya projekt)
            </span>
          </label>

          {/* Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                Flikar
              </h3>
              <button
                onClick={addTab}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Lägg till flik
              </button>
            </div>
            <div className="space-y-3">
              {tabs.map((tab, i) => (
                <div
                  key={i}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-[8px] bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Namn</label>
                      <input
                        value={tab.name}
                        onChange={e => handleTabNameChange(i, e.target.value)}
                        placeholder="T.ex. Ritningar"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nyckel</label>
                      <input
                        value={tab.key}
                        onChange={e => handleTabField(i, 'key', e.target.value)}
                        placeholder="auto"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ikon</label>
                      <select
                        value={tab.icon}
                        onChange={e => handleTabField(i, 'icon', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ICON_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        checked={tab.restricted}
                        onChange={e => handleTabField(i, 'restricted', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 accent-blue-500"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Begränsad</span>
                    </label>
                    <button
                      onClick={() => removeTab(i)}
                      disabled={tabs.length === 1}
                      className="mt-4 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[8px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Checklist Template Modal ─────────────────────────────────────────────────

interface ChecklistModalProps {
  initial: ChecklistTemplate | null
  onClose: () => void
  onSaved: () => void
}

function ChecklistTemplateModal({ initial, onClose, onSaved }: ChecklistModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [sections, setSections] = useState<ChecklistSection[]>(
    initial?.structure.sections ?? [{ name: '', items: [{ label: '', type: 'yes_no' }] }]
  )
  const [saving, setSaving] = useState(false)

  function addSection() {
    setSections(prev => [...prev, { name: '', items: [{ label: '', type: 'yes_no' }] }])
  }

  function removeSection(si: number) {
    setSections(prev => prev.filter((_, i) => i !== si))
  }

  function updateSectionName(si: number, value: string) {
    setSections(prev => prev.map((s, i) => (i === si ? { ...s, name: value } : s)))
  }

  function addItem(si: number) {
    setSections(prev =>
      prev.map((s, i) =>
        i === si ? { ...s, items: [...s.items, { label: '', type: 'yes_no' }] } : s
      )
    )
  }

  function removeItem(si: number, ii: number) {
    setSections(prev =>
      prev.map((s, i) =>
        i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s
      )
    )
  }

  function updateItem(si: number, ii: number, field: keyof ChecklistItem, value: unknown) {
    setSections(prev =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              items: s.items.map((item, j) => {
                if (j !== ii) return item
                const updated = { ...item, [field]: value }
                // Reset config when type changes
                if (field === 'type') updated.config = {}
                return updated
              }),
            }
          : s
      )
    )
  }

  function updateItemConfig(si: number, ii: number, configKey: string, configValue: unknown) {
    setSections(prev =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              items: s.items.map((item, j) =>
                j === ii ? { ...item, config: { ...(item.config ?? {}), [configKey]: configValue } } : item
              ),
            }
          : s
      )
    )
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Namn krävs')
      return
    }
    if (sections.some(s => !s.name.trim())) {
      toast.error('Alla sektioner måste ha ett namn')
      return
    }
    if (sections.some(s => s.items.some(item => !item.label.trim()))) {
      toast.error('Alla punkter måste ha en etikett')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        structure: { sections },
      }

      if (initial) {
        await apiFetch(`/api/templates/checklists/${initial.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        toast.success('Checklistmall uppdaterad')
      } else {
        await apiFetch('/api/templates/checklists', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast.success('Checklistmall skapad')
      }
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initial ? 'Redigera checklistmall' : 'Ny checklistmall'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Namn <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="T.ex. Grundarbeten"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Beskrivning
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Valfri beskrivning..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Välj kategori —</option>
              {CHECKLIST_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                Sektioner
              </h3>
              <button
                onClick={addSection}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ny sektion
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section, si) => (
                <div
                  key={si}
                  className="border border-gray-200 dark:border-gray-600 rounded-[8px] overflow-hidden"
                >
                  {/* Section header */}
                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700">
                    <input
                      value={section.name}
                      onChange={e => updateSectionName(si, e.target.value)}
                      placeholder="Sektionens namn..."
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded-[8px] bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeSection(si)}
                      disabled={sections.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Items */}
                  <div className="p-3 space-y-2">
                    {section.items.map((item, ii) => (
                      <div key={ii} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            value={item.label}
                            onChange={e => updateItem(si, ii, 'label', e.target.value)}
                            placeholder="Punkt etikett..."
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={item.type}
                            onChange={e => updateItem(si, ii, 'type', e.target.value as ChecklistItem['type'])}
                            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-[8px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {ITEM_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeItem(si, ii)}
                            disabled={section.items.length === 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Type-specific config */}
                        {item.type === 'measurement' && (
                          <input
                            value={(item.config?.unit as string) ?? ''}
                            onChange={e => updateItemConfig(si, ii, 'unit', e.target.value)}
                            placeholder="Enhet (t.ex. mm, m², kg)"
                            className="w-full px-2 py-1.5 text-xs border border-blue-200 dark:border-blue-700 rounded-[8px] bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        {item.type === 'dropdown' && (
                          <input
                            value={((item.config?.options as string[]) ?? []).join(', ')}
                            onChange={e =>
                              updateItemConfig(
                                si,
                                ii,
                                'options',
                                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="Alternativ separerade med komma (t.ex. Godkänd, Ej godkänd)"
                            className="w-full px-2 py-1.5 text-xs border border-blue-200 dark:border-blue-700 rounded-[8px] bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => addItem(si)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Lägg till punkt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[8px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [activeTab, setActiveTab] = useState<'binders' | 'checklists'>('binders')

  // Binder state
  const [binderTemplates, setBinderTemplates] = useState<BinderTemplate[]>([])
  const [binderLoading, setBinderLoading] = useState(true)
  const [binderModal, setBinderModal] = useState<{ open: boolean; template: BinderTemplate | null }>({
    open: false,
    template: null,
  })

  // Checklist state
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([])
  const [checklistLoading, setChecklistLoading] = useState(true)
  const [checklistModal, setChecklistModal] = useState<{ open: boolean; template: ChecklistTemplate | null }>({
    open: false,
    template: null,
  })

  async function fetchBinders() {
    setBinderLoading(true)
    try {
      const data = await apiFetch<{ templates: BinderTemplate[] }>('/api/templates/binders')
      setBinderTemplates(data.templates ?? [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte hämta pärmmallar')
    } finally {
      setBinderLoading(false)
    }
  }

  async function fetchChecklists() {
    setChecklistLoading(true)
    try {
      const data = await apiFetch<{ templates: ChecklistTemplate[] }>('/api/templates/checklists')
      setChecklistTemplates(data.templates ?? [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte hämta checklistmallar')
    } finally {
      setChecklistLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchBinders()
      fetchChecklists()
    }
  }, [isAdmin])

  async function deleteBinder(id: string) {
    if (!confirm('Ta bort pärmallen? Det går inte att ångra.')) return
    try {
      await apiFetch(`/api/templates/binders/${id}`, { method: 'DELETE' })
      toast.success('Pärmall borttagen')
      fetchBinders()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte ta bort')
    }
  }

  async function deleteChecklist(id: string) {
    if (!confirm('Ta bort checklistmallen? Det går inte att ångra.')) return
    try {
      await apiFetch(`/api/templates/checklists/${id}`, { method: 'DELETE' })
      toast.success('Checklistmall borttagen')
      fetchChecklists()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte ta bort')
    }
  }

  // ─── Loading / Auth guard ─────────────────────────────────────────────────

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-2V9m0 0V7m0 2H7m5 0h5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Behörighet saknas</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Du behöver administratörsbehörighet för att hantera mallar.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Mallhantering
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Hantera pärmmallar och checklistmallar för ditt konto
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-200 dark:bg-gray-700 rounded-[8px] p-1 w-fit">
            <button
              onClick={() => setActiveTab('binders')}
              className={`px-5 py-2 rounded-[8px] text-sm font-semibold transition-all ${
                activeTab === 'binders'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Pärmmallar
            </button>
            <button
              onClick={() => setActiveTab('checklists')}
              className={`px-5 py-2 rounded-[8px] text-sm font-semibold transition-all ${
                activeTab === 'checklists'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Checklistmallar
            </button>
          </div>

          {/* ── Binder Templates Tab ── */}
          {activeTab === 'binders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {binderTemplates.length} mall{binderTemplates.length !== 1 ? 'ar' : ''}
                </p>
                <button
                  onClick={() => setBinderModal({ open: true, template: null })}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-[8px] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ny pärmall
                </button>
              </div>

              {binderLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : binderTemplates.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Inga pärmmallar ännu</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Skapa din första mall ovan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {binderTemplates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">
                            {template.name}
                          </span>
                          {template.is_default && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full flex-shrink-0">
                              Standard
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {template.structure.tabs.length} flik{template.structure.tabs.length !== 1 ? 'ar' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setBinderModal({ open: true, template })}
                          className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-[8px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => deleteBinder(template.id)}
                          className="px-3 py-1.5 text-xs font-semibold border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-[8px] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Ta bort
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Checklist Templates Tab ── */}
          {activeTab === 'checklists' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {checklistTemplates.length} mall{checklistTemplates.length !== 1 ? 'ar' : ''}
                </p>
                <button
                  onClick={() => setChecklistModal({ open: true, template: null })}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-[8px] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ny checklistmall
                </button>
              </div>

              {checklistLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : checklistTemplates.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Inga checklistmallar ännu</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Skapa din första mall ovan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checklistTemplates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">
                            {template.name}
                          </span>
                          {template.category && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex-shrink-0">
                              {template.category}
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {countItems(template)} punkt{countItems(template) !== 1 ? 'er' : ''} i{' '}
                          {template.structure.sections.length} sektion{template.structure.sections.length !== 1 ? 'er' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setChecklistModal({ open: true, template })}
                          className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-[8px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => deleteChecklist(template.id)}
                          className="px-3 py-1.5 text-xs font-semibold border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-[8px] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Ta bort
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Binder modal */}
      {binderModal.open && (
        <BinderTemplateModal
          initial={binderModal.template}
          onClose={() => setBinderModal({ open: false, template: null })}
          onSaved={() => {
            setBinderModal({ open: false, template: null })
            fetchBinders()
          }}
        />
      )}

      {/* Checklist modal */}
      {checklistModal.open && (
        <ChecklistTemplateModal
          initial={checklistModal.template}
          onClose={() => setChecklistModal({ open: false, template: null })}
          onSaved={() => {
            setChecklistModal({ open: false, template: null })
            fetchChecklists()
          }}
        />
      )}
    </div>
  )
}
