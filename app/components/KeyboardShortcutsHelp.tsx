// app/components/KeyboardShortcutsHelp.tsx
'use client'

import { useEffect, useRef } from 'react'
import { X, Keyboard } from 'lucide-react'
import { useKeyboardShortcuts, formatShortcut, KeyboardShortcut } from '@/hooks/useKeyboardShortcuts'

interface ShortcutRowProps {
 shortcut: KeyboardShortcut
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
 return (
  <div className="flex justify-between items-center py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
   <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
   <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm font-mono border border-gray-300 dark:border-gray-500">
    {formatShortcut(shortcut)}
   </kbd>
  </div>
 )
}

export function KeyboardShortcutsHelp() {
 const { shortcuts, showHelp, setShowHelp } = useKeyboardShortcuts()
 const modalRef = useRef<HTMLDivElement>(null)

 // Focus trap
 useEffect(() => {
  if (showHelp) {
   modalRef.current?.focus()
  }
 }, [showHelp])

 if (!showHelp) return null

 const navigationShortcuts = shortcuts.filter(s => s.category === 'navigation')
 const actionShortcuts = shortcuts.filter(s => s.category === 'actions')
 const helpShortcuts = shortcuts.filter(s => s.category === 'help')

 return (
  <div 
   className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
   onClick={() => setShowHelp(false)}
   role="dialog"
   aria-modal="true"
   aria-labelledby="shortcuts-title"
  >
   <div 
    ref={modalRef}
    tabIndex={-1}
    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
    onClick={e => e.stopPropagation()}
   >
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
     <div className="flex items-center gap-2">
      <Keyboard className="w-5 h-5 text-primary-500" aria-hidden="true" />
      <h2 id="shortcuts-title" className="text-lg font-semibold text-gray-900 dark:text-white">
       Tangentbordsgenvägar
      </h2>
     </div>
     <button
      onClick={() => setShowHelp(false)}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Stäng"
     >
      <X className="w-5 h-5" aria-hidden="true" />
     </button>
    </div>

    {/* Content */}
    <div className="p-4 overflow-y-auto max-h-[60vh]">
     {/* Navigation */}
     <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
       Navigering
      </h3>
      <div className="space-y-1">
       {navigationShortcuts.map((shortcut, i) => (
        <ShortcutRow key={i} shortcut={shortcut} />
       ))}
      </div>
     </div>

     {/* Actions */}
     <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
       Åtgärder
      </h3>
      <div className="space-y-1">
       {actionShortcuts.map((shortcut, i) => (
        <ShortcutRow key={i} shortcut={shortcut} />
       ))}
      </div>
     </div>

     {/* Help */}
     <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
       Hjälp
      </h3>
      <div className="space-y-1">
       {helpShortcuts.map((shortcut, i) => (
        <ShortcutRow key={i} shortcut={shortcut} />
       ))}
      </div>
     </div>
    </div>

    {/* Footer */}
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
     <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
      Tryck <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Shift + ?</kbd> för att visa/dölja denna hjälp
     </p>
    </div>
   </div>
  </div>
 )
}
