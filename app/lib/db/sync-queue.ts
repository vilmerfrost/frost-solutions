// app/lib/db/sync-queue.ts
// Functions for managing sync queue

import { getDB } from './database';
import type { SyncQueueItem, LocalWorkOrder } from './types';

/**
 * Add item to sync queue
 */
export const addToSyncQueue = async (
 tenant_id: string,
 workOrderId: string,
 action: SyncQueueItem['action'],
 payload: Partial<LocalWorkOrder>,
 client_change_id: string
): Promise<void> => {
 const database = getDB();
 try {
  await database.open();
  await database.syncQueue.add({
   tenant_id,
   workOrderId,
   action,
   payload,
   createdAt: Date.now(),
   attempts: 0,
   lastAttempt: null,
   isSynced: false,
   client_change_id
  });
 } catch (error) {
  console.error('Failed to add item to sync queue:', error);
  throw error;
 }
};

/**
 * Get pending sync items for a tenant
 */
export const getPendingSyncItems = async (tenant_id: string): Promise<SyncQueueItem[]> => {
 const database = getDB();
 try {
  await database.open();
  const allItems = await database.syncQueue
   .where('tenant_id')
   .equals(tenant_id)
   .toArray();
  
  return allItems.filter(item => !item.isSynced);
 } catch (error) {
  console.error('Error getting pending sync items:', error);
  return [];
 }
};

/**
 * Mark sync item as synced
 */
export const markAsSynced = async (syncId: number): Promise<void> => {
 const database = getDB();
 try {
  await database.open();
  await database.syncQueue.update(syncId, {
   isSynced: true,
   lastAttempt: Date.now()
  });
 } catch (error) {
  console.error('Failed to mark sync item as synced:', error);
 }
};

/**
 * Increment retry attempts for sync item
 */
export const incrementAttempts = async (syncId: number): Promise<void> => {
 const database = getDB();
 try {
  await database.open();
  const item = await database.syncQueue.get(syncId);
  if (!item) return;

  await database.syncQueue.update(syncId, {
   attempts: item.attempts + 1,
   lastAttempt: Date.now()
  });
 } catch (error) {
  console.error('Failed to increment attempts:', error);
 }
};

/**
 * Get sync item by client_change_id
 */
export const getSyncItemByClientId = async (
 tenant_id: string,
 client_change_id: string
): Promise<SyncQueueItem | undefined> => {
 const database = getDB();
 try {
  await database.open();
  return await database.syncQueue
   .where('tenant_id')
   .equals(tenant_id)
   .filter(item => item.client_change_id === client_change_id)
   .first();
 } catch (error) {
  console.error('Failed to get sync item by client_change_id:', error);
  return undefined;
 }
};

