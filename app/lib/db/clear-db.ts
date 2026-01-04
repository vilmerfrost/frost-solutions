// app/lib/db/clear-db.ts
// Utility för att rensa IndexedDB vid problem

'use client'

import { getDatabase } from './indexeddb'

/**
 * Rensa hela IndexedDB databasen
 * Används när det finns corrupt data eller key format issues
 */
export async function clearIndexedDB(): Promise<void> {
 try {
  const database = getDatabase()
  
  // Close database first
  database.close()
  
  // Delete entire database
  await database.delete()
  
  console.log('✅ IndexedDB cleared successfully')
  
  // Reopen database (will recreate with fresh schema)
  await database.open()
  
  console.log('✅ IndexedDB recreated')
 } catch (error) {
  console.error('❌ Failed to clear IndexedDB:', error)
  
  // Fallback: try to delete via indexedDB API directly
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
   try {
    const deleteReq = indexedDB.deleteDatabase('frost-offline-db')
    await new Promise<void>((resolve, reject) => {
     deleteReq.onsuccess = () => resolve()
     deleteReq.onerror = () => reject(deleteReq.error)
     deleteReq.onblocked = () => {
      console.warn('IndexedDB delete blocked, please close other tabs')
      resolve() // Still resolve to avoid hanging
     }
    })
    console.log('✅ IndexedDB deleted via direct API')
   } catch (directError) {
    console.error('❌ Failed to delete via direct API:', directError)
   }
  }
 }
}

