// app/lib/idb-persister.ts

'use client';

import { get, set, del } from 'idb-keyval';
import type { Persister } from '@tanstack/react-query-persist-client';
import type { PersistedClient } from '@tanstack/react-query-persist-client';

const IDB_KEY = 'frost-react-query-cache';

// Ensure key is a valid IndexedDB key (string, number, Date, or ArrayBuffer)
// idb-keyval uses string keys by default, so this should be safe

/**
 * Skapar en anpassad persister för React Query som använder idb-keyval.
 * Med robust error handling för IndexedDB-problem.
 */
export function createIDBPersister(): Persister {
 return {
  persistClient: async (client: PersistedClient) => {
   try {
    // Validate client before persisting
    if (!client || typeof client !== 'object') {
     console.warn('⚠️ Invalid client data, skipping persist');
     return;
    }

    // Check if client has required structure
    if (!('clientState' in client) || !('timestamp' in client)) {
     console.warn('⚠️ Client missing required fields, skipping persist');
     return;
    }

    // Serialize to ensure it's a valid JSON object
    const serialized = JSON.parse(JSON.stringify(client));
    await set(IDB_KEY, serialized);
    console.log('✅ Cache persisted to IndexedDB');
   } catch (error) {
    console.error('❌ Failed to persist cache:', error);
    // Don't throw - persisting is best-effort
    // Try to clear potentially corrupted data
    try {
     await del(IDB_KEY);
    } catch {
     // Ignore clear errors
    }
   }
  },

  restoreClient: async (): Promise<PersistedClient | undefined> => {
   try {
    const client = await get<PersistedClient>(IDB_KEY);
    
    if (!client) {
     return undefined;
    }

    // Validate structure
    if (typeof client !== 'object' || !('clientState' in client) || !('timestamp' in client)) {
     console.warn('⚠️ Invalid client structure, clearing');
     await del(IDB_KEY);
     return undefined;
    }

    console.log('✅ Cache restored from IndexedDB');
    return client;
   } catch (error) {
    console.error('❌ Failed to restore cache:', error);
    // Clear potentially corrupted data
    try {
     await del(IDB_KEY);
    } catch {
     // Ignore clear errors
    }
    return undefined;
   }
  },

  removeClient: async () => {
   try {
    await del(IDB_KEY);
    console.log('✅ Cache cleared from IndexedDB');
   } catch (error) {
    console.error('❌ Failed to clear cache:', error);
   }
  }
 };
}

