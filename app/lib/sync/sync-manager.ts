// app/lib/sync/sync-manager.ts

import { syncToServer, syncFromServer } from './sync-engine';
import { RetryStrategy } from './retry';

type SyncEventListener = (data?: any) => void;

/**
 * Sync Manager - orchestrates periodic sync, on-online, on-visibilitychange
 * Includes event emitter for UI updates
 */
export class SyncManager {
 private static _instance: SyncManager | null = null;

 static get instance(): SyncManager {
  if (!this._instance) {
   this._instance = new SyncManager();
  }
  return this._instance;
 }

 private running = false;
 private timer: NodeJS.Timeout | null = null;
 private lastSyncTs: Record<string, number> = {}; // per tenant
 private retry = new RetryStrategy({ initialDelayMs: 1000, maxAttempts: 5 });
 
 // Event emitter pattern
 private listeners: Record<string, SyncEventListener[]> = {
  'sync:start': [],
  'sync:progress': [],
  'sync:complete': [],
  'sync:error': [],
 };

 /**
  * Subscribe to sync events
  */
 on(event: 'sync:start' | 'sync:progress' | 'sync:complete' | 'sync:error', listener: SyncEventListener): void {
  this.listeners[event].push(listener);
 }

 /**
  * Unsubscribe from sync events
  */
 off(event: 'sync:start' | 'sync:progress' | 'sync:complete' | 'sync:error', listener: SyncEventListener): void {
  this.listeners[event] = this.listeners[event].filter(l => l !== listener);
 }

 /**
  * Emit event to all listeners
  */
 private emit(event: 'sync:start' | 'sync:progress' | 'sync:complete' | 'sync:error', data?: any): void {
  this.listeners[event].forEach(listener => listener(data));
 }

 /**
  * Start background sync for a tenant
  */
 startBackgroundSync(tenantId: string, intervalMs = 30_000): void {
  if (this.timer) {
   clearInterval(this.timer);
  }

  // Periodic sync
  this.timer = setInterval(() => {
   this.sync(tenantId).catch((err) => {
    console.error('Background sync failed:', err);
   });
  }, intervalMs);

  // Sync on online
  if (typeof window !== 'undefined') {
   window.addEventListener('online', () => {
    console.log('🟢 Online - triggering sync');
    this.sync(tenantId).catch((err) => {
     console.error('Online sync failed:', err);
    });
   });

   // Sync on visibility change
   document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
     console.log('👁️ Page visible - triggering sync');
     this.sync(tenantId).catch((err) => {
      console.error('Visibility sync failed:', err);
     });
    }
   });
  }
 }

 /**
  * Stop background sync
  */
 stopBackgroundSync(): void {
  if (this.timer) {
   clearInterval(this.timer);
   this.timer = null;
  }
 }

 /**
  * Execute sync (push then pull)
  */
 async sync(tenantId: string): Promise<void> {
  if (this.running) {
   console.log('⏳ Sync already running, skipping...');
   return;
  }

  if (typeof window !== 'undefined' && !navigator.onLine) {
   console.log('📴 Offline - skipping sync');
   return;
  }

  this.running = true;
  this.emit('sync:start');

  try {
   // Push first (reduces pull conflicts)
   const pushResult = await this.retry.execute(async () => {
    const result = await syncToServer(tenantId);
    this.emit('sync:progress', {
     current: result.syncedCount,
     total: result.syncedCount + result.failedCount,
     message: `Synkar ${result.syncedCount} ändringar...`
    });
    return result;
   });

   // Pull updates
   const since = this.lastSyncTs[tenantId] ?? null;
   const newTs = await this.retry.execute(async () => {
    return await syncFromServer(tenantId, since);
   });

   this.lastSyncTs[tenantId] = newTs;
   console.log('✅ Sync completed successfully');
   this.emit('sync:complete', {
    syncedCount: pushResult.syncedCount,
    conflictCount: pushResult.conflictCount
   });
  } catch (error) {
   console.error('❌ Sync failed:', error);
   this.emit('sync:error', error instanceof Error ? error : new Error(String(error)));
   throw error;
  } finally {
   this.running = false;
  }
 }

 /**
  * Manual sync trigger
  */
 async manualSync(tenantId: string): Promise<void> {
  return this.sync(tenantId);
 }

 /**
  * Get last sync time for a tenant
  */
 getLastSyncTime(tenantId: string): number | null {
  return this.lastSyncTs[tenantId] ?? null;
 }

 /**
  * Set last sync time for a tenant
  */
 setLastSyncTime(tenantId: string, timestamp: number): void {
  this.lastSyncTs[tenantId] = timestamp;
 }
}

// Export singleton instance
export const syncManager = SyncManager.instance;

