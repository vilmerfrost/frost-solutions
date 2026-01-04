'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { queryClient } from '@/lib/queryClient'
import { installFetchGuard } from '@/lib/guards/fetchRestGuard'

export function QueryProvider({ children }: { children: ReactNode }) {
 const [persister, setPersister] = useState<ReturnType<typeof createSyncStoragePersister> | null>(null)

 useEffect(() => {
  if (typeof window === 'undefined') return

  // Install global fetch guard in dev mode
  installFetchGuard()

  try {
   const syncPersister = createSyncStoragePersister({ storage: window.localStorage })
   setPersister(syncPersister)
  } catch (error) {
   console.warn('QueryProvider: failed to initialise persistence, falling back to in-memory cache.', error)
   setPersister(null)
  }

  const setStatus = () => {
   const online = navigator.onLine
   onlineManager.setOnline(online)
  }

  setStatus()
  const handleOnline = () => {
   onlineManager.setOnline(true)
  }
  const handleOffline = () => {
   onlineManager.setOnline(false)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
   window.removeEventListener('online', handleOnline)
   window.removeEventListener('offline', handleOffline)
  }
 }, [])

 if (!persister) {
  return (
   <QueryClientProvider client={queryClient}>
    {children}
   </QueryClientProvider>
  )
 }

 return (
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
   {children}
  </PersistQueryClientProvider>
 )
}

