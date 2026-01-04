// app/hooks/useOnlineStatus.ts

'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'

/**
 * Hook för att detektera online/offline-status.
 * Hanterar även toast-meddelanden vid statusbyte.
 */
export function useOnlineStatus() {
 const [isOnline, setIsOnline] = useState(true)
 const [wasOffline, setWasOffline] = useState(false)

 useEffect(() => {
  // Sätt initialt tillstånd
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
   setIsOnline(navigator.onLine)
   if (!navigator.onLine) {
    setWasOffline(true)
   }
  }

  const handleOnline = () => {
   setIsOnline(true)
   if (wasOffline) {
    toast.info('Du är online igen. Synkar ändringar...', { id: 'online-status' })
    // Trigger sync via custom event
    window.dispatchEvent(new CustomEvent('app-coming-online'))
   }
  }

  const handleOffline = () => {
   setIsOnline(false)
   setWasOffline(true)
   toast.warning('Du är offline. Ändringar sparas lokalt.', { id: 'online-status' })
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
   window.removeEventListener('online', handleOnline)
   window.removeEventListener('offline', handleOffline)
  }
 }, [wasOffline])

 return { isOnline, wasOffline }
}

