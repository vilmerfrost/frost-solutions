// app/components/OnlineStatusIndicator.tsx

'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

type SyncStatus = 'online' | 'offline' | 'syncing'

const statusConfig: Record<SyncStatus, { 
 icon: React.ReactNode
 text: string
 className: string
}> = {
 online: {
  icon: <Wifi className="w-4 h-4" />,
  text: 'Online',
  className: 'text-green-600 dark:text-green-400',
 },
 offline: {
  icon: <WifiOff className="w-4 h-4" />,
  text: 'Offline',
  className: 'text-red-500 dark:text-red-400',
 },
 syncing: {
  icon: <RefreshCw className="w-4 h-4 animate-spin" />,
  text: 'Synkar...',
  className: 'text-blue-500 dark:text-blue-400',
 },
}

/**
 * Visar en ikon och text för det aktuella anslutnings- och synktillståndet.
 * Avsedd att placeras i en global header eller sidebar.
 */
export function OnlineStatusIndicator() {
 const { isOnline } = useOnlineStatus()
 
 // useSyncStatus is now robust and won't throw errors
 const { isSyncing } = useSyncStatus()

 let status: SyncStatus = 'online'
 if (!isOnline) {
  status = 'offline'
 } else if (isSyncing) {
  status = 'syncing'
 }

 const config = statusConfig[status]

 return (
  <div
   className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${config.className}`}
   role="status"
   aria-live="polite"
   aria-label={`Anslutningsstatus: ${config.text}`}
  >
   {config.icon}
   <span className="text-sm font-medium hidden sm:inline">{config.text}</span>
  </div>
 )
}

