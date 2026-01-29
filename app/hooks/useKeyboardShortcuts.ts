// app/hooks/useKeyboardShortcuts.ts
'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
 key: string
 ctrlKey?: boolean
 shiftKey?: boolean
 altKey?: boolean
 metaKey?: boolean
 description: string
 action: () => void
 category: 'navigation' | 'actions' | 'help'
}

// Global shortcuts configuration
const createShortcuts = (router: ReturnType<typeof useRouter>): KeyboardShortcut[] => [
 // Navigation shortcuts
 {
  key: 'g',
  altKey: true,
  description: 'Gå till Dashboard',
  action: () => router.push('/dashboard'),
  category: 'navigation',
 },
 {
  key: 'p',
  altKey: true,
  description: 'Gå till Projekt',
  action: () => router.push('/projects'),
  category: 'navigation',
 },
 {
  key: 'f',
  altKey: true,
  description: 'Gå till Fakturor',
  action: () => router.push('/invoices'),
  category: 'navigation',
 },
 {
  key: 't',
  altKey: true,
  description: 'Rapportera tid',
  action: () => router.push('/reports/new'),
  category: 'navigation',
 },
 {
  key: 'k',
  altKey: true,
  description: 'Gå till Kunder',
  action: () => router.push('/clients'),
  category: 'navigation',
 },
 {
  key: 'a',
  altKey: true,
  description: 'Gå till Anställda',
  action: () => router.push('/employees'),
  category: 'navigation',
 },
 // Action shortcuts
 {
  key: 'n',
  ctrlKey: true,
  shiftKey: true,
  description: 'Nytt projekt',
  action: () => router.push('/projects/new'),
  category: 'actions',
 },
 {
  key: 'i',
  ctrlKey: true,
  shiftKey: true,
  description: 'Ny faktura',
  action: () => router.push('/invoices/new'),
  category: 'actions',
 },
]

export function useKeyboardShortcuts() {
 const router = useRouter()
 const [showHelp, setShowHelp] = useState(false)
 
 const shortcuts = createShortcuts(router)

 // Add help shortcut
 const allShortcuts: KeyboardShortcut[] = [
  ...shortcuts,
  {
   key: '?',
   shiftKey: true,
   description: 'Visa tangentbordsgenvägar',
   action: () => setShowHelp(prev => !prev),
   category: 'help',
  },
  {
   key: 'Escape',
   description: 'Stäng dialoger/modaler',
   action: () => setShowHelp(false),
   category: 'help',
  },
 ]

 const handleKeyDown = useCallback((event: KeyboardEvent) => {
  // Don't trigger shortcuts when typing in inputs
  const target = event.target as HTMLElement
  if (
   target.tagName === 'INPUT' ||
   target.tagName === 'TEXTAREA' ||
   target.isContentEditable
  ) {
   // Only allow Escape in inputs
   if (event.key !== 'Escape') return
  }

  for (const shortcut of allShortcuts) {
   const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
   const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey)
   const shiftMatch = !!shortcut.shiftKey === event.shiftKey
   const altMatch = !!shortcut.altKey === event.altKey

   if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
    event.preventDefault()
    shortcut.action()
    return
   }
  }
 }, [allShortcuts])

 useEffect(() => {
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
 }, [handleKeyDown])

 return {
  shortcuts: allShortcuts,
  showHelp,
  setShowHelp,
 }
}

// Format shortcut key for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
 const parts: string[] = []
 
 if (shortcut.ctrlKey) parts.push('Ctrl')
 if (shortcut.altKey) parts.push('Alt')
 if (shortcut.shiftKey) parts.push('Shift')
 if (shortcut.metaKey) parts.push('⌘')
 
 const key = shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase()
 parts.push(key)
 
 return parts.join(' + ')
}
