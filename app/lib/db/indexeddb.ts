// app/lib/db/indexeddb.ts
// Main entry point - re-exports everything for backward compatibility

export type { LocalWorkOrder, SyncQueueItem } from './types';
export { getDatabase, db } from './database';
export {
 addToSyncQueue,
 getPendingSyncItems,
 markAsSynced,
 incrementAttempts,
 getSyncItemByClientId
} from './sync-queue';
