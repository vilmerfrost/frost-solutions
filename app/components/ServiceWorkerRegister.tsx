'use client'

import { useEffect } from 'react'
import { toast } from '@/lib/toast'

export default function ServiceWorkerRegister() {
 useEffect(() => {
  if ('serviceWorker' in navigator) {
   const registerServiceWorker = async () => {
    try {
     const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
     })
     
     console.log('[SW] Registrering lyckades, scope:', registration.scope)

     // Lyssna efter uppdateringar
     registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing
      if (installingWorker) {
       installingWorker.addEventListener('statechange', () => {
        if (
         installingWorker.state === 'installed' &&
         navigator.serviceWorker.controller
        ) {
         // Ny version är installerad och väntar
         console.log('[SW] Ny version tillgänglig')
         toast.info('En ny version finns tillgänglig!', {
          action: {
           label: 'Ladda om',
           onClick: () => {
            installingWorker.postMessage({ type: 'SKIP_WAITING' })
            window.location.reload()
           },
          },
          duration: Infinity,
         })
        }
       })
      }
     })

     // Check for updates every 6 hours
     setInterval(() => {
      registration.update()
     }, 6 * 60 * 60 * 1000)

     // Lyssna på messages från Service Worker
     navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_REQUEST') {
       // Trigger sync via custom event
       window.dispatchEvent(new CustomEvent('sw-sync-request'))
      }
     })
    } catch (error) {
     console.error('[SW] Registrering misslyckades:', error)
    }
   }

   window.addEventListener('load', registerServiceWorker)
  }
 }, [])

 return null
}
