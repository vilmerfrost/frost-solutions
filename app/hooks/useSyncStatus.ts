// app/hooks/useSyncStatus.ts

'use client'

import { getDatabase } from '@/lib/db/indexeddb'
import { syncManager } from '@/lib/sync/sync-manager'
import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'

interface SyncState {
 isSyncing: boolean
 message: string
 current: number
 total: number
}

/**
 * Hook för att övervaka status för Dexie-synkronisering.
 * Uses manual polling instead of useLiveQuery to avoid IndexedDB key issues.
 */
export function useSyncStatus() {
 // 1. Räkna objekt som väntar på synkning (manual polling för att undvika key issues)
 const [pendingCount, setPendingCount] = useState(0)

 useEffect(() => {
  // Check if IndexedDB is available
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
   return
  }

  // Poll for pending count every 2 seconds
  const updatePendingCount = async () => {
   try {
    // Use getDatabase to ensure DB is initialized
    const database = getDatabase()
    // Ensure database is open
    await database.open()
    const allItems = await database.syncQueue.toArray()
    const count = allItems.filter(item => !item.isSynced).length
    setPendingCount(count)
   } catch (error) {
    // Silently fail - IndexedDB might not be available or have issues
    // Don't spam console with errors
    if (process.env.NODE_ENV === 'development') {
     console.warn('IndexedDB not available or error:', error)
    }
    setPendingCount(0)
   }
  }

  // Initial update (with delay to avoid blocking render)
  const timeout = setTimeout(updatePendingCount, 500)

  // Poll every 2 seconds
  const interval = setInterval(updatePendingCount, 2000)

  return () => {
   clearTimeout(timeout)
   clearInterval(interval)
  }
 }, [])

 // 2. Lyssna på syncManager-events för detaljerad status
 const [syncState, setSyncState] = useState<SyncState>({
  isSyncing: false,
  message: '',
  current: 0,
  total: 0,
 })

 useEffect(() => {
  const onSyncStart = () => {
   setSyncState((prev) => ({
    ...prev,
    isSyncing: true,
    message: 'Startar synkronisering...',
   }))
  }

  const onSyncProgress = (progress: { current: number; total: number; message: string }) => {
   setSyncState({
    isSyncing: true,
    ...progress,
   })
  }

  const onSyncComplete = (data?: { syncedCount?: number; conflictCount?: number }) => {
   setSyncState({
    isSyncing: false,
    message: 'Synkronisering klar',
    current: 0,
    total: 0,
   })
   
   const synced = data?.syncedCount ?? 0
   const conflicts = data?.conflictCount ?? 0
   
   if (synced > 0) {
    toast.success(`Alla ändringar synkade! (${synced} synkade${conflicts > 0 ? `, ${conflicts} konflikter` : ''})`)
   }
  }

  const onSyncError = (error: Error) => {
   setSyncState((prev) => ({
    ...prev,
    isSyncing: false,
   }))
   toast.error(`Kunde inte synka: ${error.message}`)
  }

  // Subscribe to events
  syncManager.on('sync:start', onSyncStart)
  syncManager.on('sync:progress', onSyncProgress)
  syncManager.on('sync:complete', onSyncComplete)
  syncManager.on('sync:error', onSyncError)

  // Listen for Service Worker sync requests
  const handleSWSyncRequest = () => {
   // Get tenantId from custom event or useTenant hook
   // This will be handled by SyncInitializer
   window.dispatchEvent(new CustomEvent('trigger-sync'))
  }

  window.addEventListener('sw-sync-request', handleSWSyncRequest)
  window.addEventListener('app-coming-online', handleSWSyncRequest)

  return () => {
   syncManager.off('sync:start', onSyncStart)
   syncManager.off('sync:progress', onSyncProgress)
   syncManager.off('sync:complete', onSyncComplete)
   syncManager.off('sync:error', onSyncError)
   window.removeEventListener('sw-sync-request', handleSWSyncRequest)
   window.removeEventListener('app-coming-online', handleSWSyncRequest)
  }
 }, [])

 return {
  isSyncing: syncState.isSyncing,
  pendingCount,
  progress: syncState,
  lastSyncTime: null, // TODO: syncManager borde spara detta
 }
}

