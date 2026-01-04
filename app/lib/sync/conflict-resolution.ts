// app/lib/sync/conflict-resolution.ts

export type WithUpdatedAt<T> = T & { updated_at: string };

/**
 * Resolve conflict using Last-Write-Wins strategy
 * Compares updated_at timestamps
 */
export function resolveLWW<T extends { updated_at: string }>(
 localRow: WithUpdatedAt<T>,
 serverRow: WithUpdatedAt<T>
): WithUpdatedAt<T> {
 const tLocal = new Date(localRow.updated_at).getTime();
 const tServer = new Date(serverRow.updated_at).getTime();

 if (Number.isNaN(tLocal) || Number.isNaN(tServer)) {
  // Faller tillbaka till servern om tidsstämplar är trasiga
  console.warn('⚠️ Invalid timestamp in conflict resolution, using server version');
  return serverRow;
 }

 if (tLocal > tServer) {
  console.log(`✅ Local version won (${tLocal} > ${tServer})`);
  return localRow;
 }

 if (tServer > tLocal) {
  console.log(`✅ Server version won (${tServer} > ${tLocal})`);
  return serverRow;
 }

 // Tie → servern vinner för determinism
 console.log('🔗 Timestamp tie - using server version');
 return serverRow;
}

/**
 * Conflict log for audit trail
 */
export type ConflictLog<T> = {
 table: 'work_orders';
 id: string;
 local: WithUpdatedAt<T>;
 server: WithUpdatedAt<T>;
 resolved: WithUpdatedAt<T>;
 resolvedBy: 'local' | 'server';
 at: string; // ISO
};

/**
 * Create conflict log entry
 */
export function makeConflictLog<T extends { updated_at: string }>(
 table: 'work_orders',
 id: string,
 local: WithUpdatedAt<T>,
 server: WithUpdatedAt<T>,
 resolved: WithUpdatedAt<T>
): ConflictLog<T> {
 const resolvedBy: 'local' | 'server' = resolved === local ? 'local' : 'server';
 
 return {
  table,
  id,
  local,
  server,
  resolved,
  resolvedBy,
  at: new Date().toISOString()
 };
}

