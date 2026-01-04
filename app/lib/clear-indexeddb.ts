// app/lib/clear-indexeddb.ts
// Utility för att rensa IndexedDB vid problem

'use client'

import { del } from 'idb-keyval'

const IDB_KEY = 'frost-react-query-cache'

/**
 * Rensa React Query cache från IndexedDB
 * Används när det finns corrupt data
 */
export async function clearReactQueryCache(): Promise<void> {
 try {
  await del(IDB_KEY)
  console.log('✅ React Query cache cleared from IndexedDB')
 } catch (error) {
  console.error('❌ Failed to clear cache:', error)
  // Try to clear entire IndexedDB if needed
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
   try {
    const deleteReq = indexedDB.deleteDatabase('keyval-store')
    deleteReq.onsuccess = () => {
     console.log('✅ Cleared entire keyval-store')
    }
    deleteReq.onerror = () => {
     console.error('❌ Failed to clear keyval-store')
    }
   } catch {
    // Ignore
   }
  }
 }
}

