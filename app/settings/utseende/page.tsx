'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'

type ThemeOption = 'default' | 'compact' | 'comfortable' | 'minimal'
type ColorScheme = 'gradient' | 'solid' | 'pastel' | 'monochrome'
type FontSize = 'small' | 'medium' | 'large'

interface ThemeSettings {
 theme: ThemeOption
 colorScheme: ColorScheme
 fontSize: FontSize
 sidebarWidth: 'narrow' | 'normal' | 'wide'
 cardStyle: 'elevated' | 'flat' | 'outlined'
}

const defaultSettings: ThemeSettings = {
 theme: 'default',
 colorScheme: 'gradient',
 fontSize: 'medium',
 sidebarWidth: 'normal',
 cardStyle: 'elevated',
}

export default function UtseendePage() {
 const router = useRouter()
 const [settings, setSettings] = useState<ThemeSettings>(defaultSettings)
 const [saving, setSaving] = useState(false)

 useEffect(() => {
  // Load saved settings from localStorage
  const saved = localStorage.getItem('frost-theme-settings')
  if (saved) {
   try {
    const parsed = JSON.parse(saved)
    setSettings({ ...defaultSettings, ...parsed })
   } catch {
    // Invalid JSON, use defaults
   }
  }
 }, [])

 function handleSave() {
  setSaving(true)
  localStorage.setItem('frost-theme-settings', JSON.stringify(settings))
  
  // Apply theme classes to document
  document.documentElement.setAttribute('data-theme', settings.theme)
  document.documentElement.setAttribute('data-color-scheme', settings.colorScheme)
  document.documentElement.setAttribute('data-font-size', settings.fontSize)
  document.documentElement.setAttribute('data-sidebar-width', settings.sidebarWidth)
  document.documentElement.setAttribute('data-card-style', settings.cardStyle)
  
  setTimeout(() => {
   setSaving(false)
   toast.success('Inställningar sparade!')
  }, 500)
 }

 function handleReset() {
  setSettings(defaultSettings)
  localStorage.removeItem('frost-theme-settings')
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-color-scheme')
  document.documentElement.removeAttribute('data-font-size')
  document.documentElement.removeAttribute('data-sidebar-width')
  document.documentElement.removeAttribute('data-card-style')
  toast.success('Inställningar återställda till standard!')
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
       Anpassa utseende
      </h1>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
       Välj layout, färger och stil för din app
      </p>
     </div>

     {/* Settings Form */}
     <div className="space-y-6">
      {/* Theme Layout */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Layout</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
         { value: 'default', label: 'Standard', desc: 'Nuvarande layout' },
         { value: 'compact', label: 'Kompakt', desc: 'Mindre mellanrum' },
         { value: 'comfortable', label: 'Bekväm', desc: 'Mer luft mellan element' },
         { value: 'minimal', label: 'Minimalistisk', desc: 'Minimal design' },
        ] as const).map((option) => (
         <button
          key={option.value}
          onClick={() => setSettings({ ...settings, theme: option.value as ThemeOption })}
          className={`p-4 rounded-[8px] border-2 transition-all text-left ${
           settings.theme === option.value
            ? 'border-primary-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
         >
          <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.desc}</div>
         </button>
        ))}
       </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Färgschema</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
         { value: 'gradient', label: 'Gradient', desc: 'Nuvarande färger med gradient' },
         { value: 'solid', label: 'Enhetlig', desc: 'Enfärgade knappar' },
         { value: 'pastel', label: 'Pastell', desc: 'Mjuka färger' },
         { value: 'monochrome', label: 'Monokrom', desc: 'Svartvitt' },
        ] as const).map((option) => (
         <button
          key={option.value}
          onClick={() => setSettings({ ...settings, colorScheme: option.value as ColorScheme })}
          className={`p-4 rounded-[8px] border-2 transition-all text-left ${
           settings.colorScheme === option.value
            ? 'border-primary-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
         >
          <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.desc}</div>
         </button>
        ))}
       </div>
      </div>

      {/* Font Size */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Textstorlek</h2>
       <div className="flex gap-4">
        {([
         { value: 'small', label: 'Liten' },
         { value: 'medium', label: 'Medium', default: true },
         { value: 'large', label: 'Stor' },
        ] as const).map((option) => (
         <button
          key={option.value}
          onClick={() => setSettings({ ...settings, fontSize: option.value as FontSize })}
          className={`px-6 py-3 rounded-[8px] border-2 transition-all ${
           settings.fontSize === option.value
            ? 'border-primary-500 bg-primary-500 text-white'
            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
         >
          {option.label}
         </button>
        ))}
       </div>
      </div>

      {/* Sidebar Width */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Sidorad bredd</h2>
       <div className="flex gap-4">
        {([
         { value: 'narrow', label: 'Smal' },
         { value: 'normal', label: 'Normal', default: true },
         { value: 'wide', label: 'Bred' },
        ] as const).map((option) => (
         <button
          key={option.value}
          onClick={() => setSettings({ ...settings, sidebarWidth: option.value as 'narrow' | 'normal' | 'wide' })}
          className={`px-6 py-3 rounded-[8px] border-2 transition-all ${
           settings.sidebarWidth === option.value
            ? 'border-primary-500 bg-primary-500 text-white'
            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
         >
          {option.label}
         </button>
        ))}
       </div>
      </div>

      {/* Card Style */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Kort-stil</h2>
       <div className="flex gap-4">
        {([
         { value: 'elevated', label: 'Höjd', desc: 'Med skugga (standard)' },
         { value: 'flat', label: 'Platt', desc: 'Ingen skugga' },
         { value: 'outlined', label: 'Outline', desc: 'Med ram' },
        ] as const).map((option) => (
         <button
          key={option.value}
          onClick={() => setSettings({ ...settings, cardStyle: option.value as 'elevated' | 'flat' | 'outlined' })}
          className={`p-4 rounded-[8px] border-2 transition-all text-left ${
           settings.cardStyle === option.value
            ? 'border-primary-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
         >
          <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.desc}</div>
         </button>
        ))}
       </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
       <button
        onClick={handleSave}
        disabled={saving}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 sm:py-4 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
       >
        {saving ? 'Sparar...' : 'Spara inställningar'}
       </button>
       <button
        onClick={handleReset}
        className="px-6 py-3 sm:py-4 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
       >
        Återställ till standard
       </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-[8px] p-4 border border-blue-200 dark:border-blue-800">
       <p className="text-sm text-blue-800 dark:text-blue-200">
        💡 <strong>Tips:</strong> Inställningarna sparas i din webbläsare. För att se effekten av vissa ändringar kan du behöva uppdatera sidan.
       </p>
      </div>
     </div>
    </div>
   </main>
  </div>
 )
}

