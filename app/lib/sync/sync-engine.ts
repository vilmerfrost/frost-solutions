// app/lib/sync/sync-engine.ts

import { db, getPendingSyncItems, markAsSynced, LocalWorkOrder, SyncQueueItem } from '@/lib/db/indexeddb';
import { RetryStrategy } from '@/lib/sync/retry';
import { resolveLWW, makeConflictLog, type ConflictLog } from '@/lib/sync/conflict-resolution';

export type SyncResult = {
 success: boolean;
 syncedCount: number;
 failedCount: number;
 conflictCount: number;
 conflicts?: ConflictLog<any>[];
};

const retry = new RetryStrategy({ initialDelayMs: 1000, maxAttempts: 7 });

/**
 * PUSH: skickar köade ändringar till servern i en batch.
 */
export async function syncToServer(tenantId: string): Promise<SyncResult> {
 try {
  // Ensure database is open before operations
  await db.open();
 } catch (error) {
  console.error('Failed to open IndexedDB for sync:', error);
  return { success: false, syncedCount: 0, failedCount: 0, conflictCount: 0 };
 }

 const items = await getPendingSyncItems(tenantId);

 if (items.length === 0) {
  return { success: true, syncedCount: 0, failedCount: 0, conflictCount: 0 };
 }

 console.log(`🔄 Syncing ${items.length} changes to server...`);

 // Bygg batch för /api/sync/work-orders (create/update/delete)
 const upserts = items
  .filter(i => i.action === 'create' || i.action === 'update')
  .map(i => ({
   client_change_id: i.client_change_id,
   id: i.workOrderId.startsWith('tmp_') ? undefined : i.workOrderId,
   base_updated_at: i.payload?.updated_at ?? null, // klientens bas
   new_values: i.payload
  }));

 const deletes = items
  .filter(i => i.action === 'delete')
  .map(i => ({
   client_change_id: i.client_change_id,
   id: i.workOrderId
  }));

 let resp: any;

 try {
  resp = await retry.execute(async () => {
   const r = await fetch('/api/sync/work-orders', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     tenant_id: tenantId,
     changes: { work_orders: { upserts, deletes } }
    })
   });

   if (!r.ok) {
    const errorText = await r.text();
    let parsed: any = errorText;
    try {
     parsed = JSON.parse(errorText);
    } catch {}

    if (r.status === 403 && (parsed?.error?.includes('Ingen tenant') || typeof parsed === 'string' && parsed.includes('Ingen tenant'))) {
     console.warn('⚠️ Sync skip: ingen tenant hittad - avbryter syncToServer');
     return { synced: [], conflicts: [], rejected: [] };
    }

    const err: any = new Error(parsed?.error || errorText || `HTTP ${r.status}`);
    err.status = r.status;
    throw err;
   }

   return r.json();
  });
 } catch (e) {
  console.error('❌ Sync to server failed:', e);
  // Tillfälligt/permanent fel; låt kö vara kvar och bubbla upp
  return {
   success: false,
   syncedCount: 0,
   failedCount: items.length,
   conflictCount: 0
  };
 }

 const { synced = [], conflicts = [], rejected = [] } = resp;

 // Markera lyckade
 let syncedCount = 0;
 for (const ok of synced) {
  const match = items.find(i => i.client_change_id === ok.client_change_id);
  if (match && match.id != null) {
   await markAsSynced(match.id);
   syncedCount++;
  }

  // Uppdatera lokalt med serverns rad (kan innehålla ny id om det var tmp)
  if (ok.row) {
   try {
    await db.work_orders.put({
     ...ok.row,
     isSynced: true
    } as LocalWorkOrder);
   } catch (error) {
    console.error('Failed to update local work order:', error);
   }
  }
 }

 // Konflikter — LWW klient-sida (för logg/audit)
 let conflictCount = 0;
 const conflictLogs: ConflictLog<any>[] = [];

 for (const c of conflicts) {
  conflictCount++;

  // c.server, c.client, c.id
  const resolved = resolveLWW(c.client, c.server);
  const log = makeConflictLog('work_orders', c.id, c.client, c.server, resolved);
  conflictLogs.push(log);

  // Spara resolution lokalt (servern har redan valt i sitt svar; men vi ser till att UI matchar)
  try {
   await db.work_orders.put({
    ...resolved,
    isSynced: true
   } as LocalWorkOrder);
  } catch (error) {
   console.error('Failed to save conflict resolution:', error);
  }

  const match = items.find(i => i.client_change_id === c.client_change_id);
  if (match && match.id != null) {
   await markAsSynced(match.id);
  }
 }

 // Rejected (permanent) — ta bort ur kö men lämna lokalt orört (UI kan visa varning)
 let failedCount = 0;
 for (const rj of rejected) {
  failedCount++;
  const match = items.find(i => i.client_change_id === rj.client_change_id);
  if (match && match.id != null) {
   await markAsSynced(match.id); // markeras som "synced" för att avlägsnas
  }
 }

 console.log(`✅ Sync completed: ${syncedCount} synced, ${conflictCount} conflicts, ${failedCount} rejected`);

 return {
  success: true,
  syncedCount,
  failedCount,
  conflictCount,
  conflicts: conflictLogs
 };
}

/**
 * PULL: hämta delta (updated_at > lastSyncTime) i batches till lokalt DB.
 * Returnerar ny `lastSyncTime` (server cursor).
 */
export async function syncFromServer(
 tenantId: string,
 lastSyncTime: number | null
): Promise<number> {
 const params = new URLSearchParams();
 if (lastSyncTime) {
  params.set('since', new Date(lastSyncTime).toISOString());
 }
 params.set('limit', '100');

 const response = await retry.execute(async () => {
  const res = await fetch(`/api/sync/work-orders?${params.toString()}`, {
   credentials: 'include'
  });

  if (!res.ok) {
   const errorText = await res.text();
   let parsed: any = errorText;
   try {
    parsed = JSON.parse(errorText);
   } catch {}

   if (res.status === 403 && (parsed?.error?.includes('Ingen tenant') || typeof parsed === 'string' && parsed.includes('Ingen tenant'))) {
    console.warn('⚠️ Sync skip: ingen tenant hittad - avbryter syncFromServer');
    return { cursor: new Date().toISOString(), data: [] };
   }

   const err: any = new Error(parsed?.error || errorText || `HTTP ${res.status}`);
   err.status = res.status;
   throw err;
  }

  return res.json();
 });

 const { cursor, data } = response as { cursor: string; data: any[] };

 // Merge LWW lokalt
 try {
  await db.open();

  for (const row of data || []) {
   const local = await db.work_orders.get(row.id);

   if (!local) {
    // New record
    await db.work_orders.put({
     ...row,
     isSynced: true
    } as LocalWorkOrder);
   } else {
    // Conflict - resolve with LWW
    const resolved = resolveLWW(local, row);
    await db.work_orders.put({
     ...resolved,
     isSynced: true
    } as LocalWorkOrder);
   }
  }
 } catch (error) {
  console.error('Failed to merge server data locally:', error);
 }

 const newSyncTime = new Date(cursor).getTime();
 console.log(`✅ Synced ${data?.length || 0} updates from server`);

 return newSyncTime;
}

