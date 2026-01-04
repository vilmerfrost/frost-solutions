// app/components/SyncInitializer.tsx

'use client'

import { useEffect } from 'react'
import { useTenant } from '@/context/TenantContext'
import { syncManager } from '@/lib/sync/sync-manager'

/**
 * Initializer component that starts background sync when tenant is ready
 */
export function SyncInitializer() {
 const { tenantId } = useTenant()

 useEffect(() => {
  if (tenantId) {
   // Start background sync
   syncManager.startBackgroundSync(tenantId, 30_000) // 30 seconds

   // Initial sync
   syncManager.manualSync(tenantId).catch((error) => {
    console.error('Initial sync failed:', error)
   })

   // Listen for sync triggers from Service Worker or other sources
   const handleTriggerSync = () => {
    syncManager.manualSync(tenantId).catch(console.error)
   }

   window.addEventListener('trigger-sync', handleTriggerSync)
   window.addEventListener('sw-sync-request', handleTriggerSync)
   window.addEventListener('app-coming-online', handleTriggerSync)

   return () => {
    syncManager.stopBackgroundSync()
    window.removeEventListener('trigger-sync', handleTriggerSync)
    window.removeEventListener('sw-sync-request', handleTriggerSync)
    window.removeEventListener('app-coming-online', handleTriggerSync)
   }
  }
 }, [tenantId])

 return null
}

