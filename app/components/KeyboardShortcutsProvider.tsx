// app/components/KeyboardShortcutsProvider.tsx
'use client'

import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'

/**
 * Client component wrapper for keyboard shortcuts functionality.
 * Add this to layout to enable global keyboard shortcuts.
 */
export function KeyboardShortcutsProvider() {
 return <KeyboardShortcutsHelp />
}
