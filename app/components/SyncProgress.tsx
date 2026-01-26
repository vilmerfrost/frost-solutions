// app/components/SyncProgress.tsx

'use client'

import { useSyncStatus } from '@/hooks/useSyncStatus'
import { RefreshCw } from 'lucide-react'

/**
 * Visar en progress-bar och statusmeddelande under en aktiv synkronisering.
 * Positioneras längst ner på skärmen.
 */
export function SyncProgress() {
 // useSyncStatus is now robust and won't throw errors
 const { isSyncing, progress, pendingCount } = useSyncStatus()
 
 const progressPercent = progress.total > 0 
  ? (progress.current / progress.total) * 100 
  : pendingCount > 0 
  ? 50 // Indeterminate progress
  : 0

 // Only show when actively syncing with pending changes, not on initial page loads
 // This prevents the bar from showing briefly on every navigation
 if (!isSyncing || pendingCount === 0) {
  return null
 }

 return (
  <div
   className={`fixed bottom-0 left-0 right-0 z-50 p-3 bg-blue-600 text-white shadow-md transition-transform duration-300 ease-in-out ${
    isSyncing || pendingCount > 0 ? 'translate-y-0' : 'translate-y-full'
   }`}
   role="status"
   aria-live="polite"
  >
   <div className="container mx-auto max-w-4xl">
    <div className="flex items-center justify-between gap-4">
     <div className="flex items-center gap-2">
      <RefreshCw className="w-5 h-5 animate-spin" />
      <span className="text-sm font-medium">
       {progress.message || `Synkar ${pendingCount} ändringar...`}
      </span>
     </div>
     {progress.total > 0 && (
      <span className="text-sm">
       {progress.current} / {progress.total}
      </span>
     )}
    </div>

    {/* Progress Bar */}
    {progressPercent > 0 && (
     <div className="w-full bg-blue-800 rounded-full h-1.5 mt-2">
      <div
       className="bg-white h-1.5 rounded-full transition-all duration-500"
       style={{ width: `${progressPercent}%` }}
      />
     </div>
    )}
   </div>
  </div>
 )
}

