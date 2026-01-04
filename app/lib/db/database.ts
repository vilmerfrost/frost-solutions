// app/lib/db/database.ts
// Core database instance - singleton pattern

import Dexie, { Table } from 'dexie';
import type { LocalWorkOrder, SyncQueueItem } from './types';

/**
 * Frost IndexedDB database class
 */
class FrostDB extends Dexie {
 work_orders!: Table<LocalWorkOrder, string>;
 syncQueue!: Table<SyncQueueItem, number>;

 constructor() {
  super('frost-offline-db');

  this.version(1).stores({
   // Primary key: id, indexes: tenant_id, updated_at, deleted_at, isSynced
   work_orders: 'id, tenant_id, updated_at, deleted_at, isSynced',
   // Auto-increment primary key, indexes: tenant_id, workOrderId, action, isSynced, createdAt
   syncQueue: '++id, tenant_id, workOrderId, action, isSynced, createdAt'
  });
 }
}

// Singleton instance
let dbSingleton: FrostDB | null = null;

/**
 * Get or create database instance
 * This is the ONLY way to access the database internally
 */
export const getDB = (): FrostDB => {
 if (!dbSingleton) {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
   throw new Error('IndexedDB not available');
  }
  dbSingleton = new FrostDB();
 }
 return dbSingleton;
};

/**
 * Export getter for external use
 */
export const getDatabase = (): FrostDB => getDB();

// Proxy export for direct access
export const db = new Proxy({} as FrostDB, {
 get(_target, prop) {
  const database = getDB();
  const value = (database as any)[prop];
  if (typeof value === 'function') {
   return value.bind(database);
  }
  return value;
 }
});

