// app/components/OfflineBanner.tsx

'use client'

import { useState } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { AlertCircle, X } from 'lucide-react'

/**
 * En banner som visas högst upp på sidan för att tydligt
 * informera användaren om att de är i offline-läge.
 */
export function OfflineBanner() {
 const { isOnline } = useOnlineStatus()
 const [isDismissed, setIsDismissed] = useState(false)

 if (isOnline || isDismissed) {
  return null
 }

 return (
  <div
   className="sticky top-0 z-40 w-full p-3 bg-amber-100 dark:bg-amber-900/50 border-b border-amber-300 dark:border-amber-700"
   role="status"
   aria-live="polite"
  >
   <div className="container mx-auto flex items-center justify-between gap-4">
    <div className="flex items-center gap-2">
     <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-300 flex-shrink-0" />
     <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
      Du arbetar offline. Ändringar sparas lokalt och synkas när du är online igen.
     </p>
    </div>
    <button
     onClick={() => setIsDismissed(true)}
     className="p-1 rounded-full text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
     aria-label="Dölj offline-meddelande"
    >
     <X className="w-5 h-5" />
    </button>
   </div>
  </div>
 )
}

