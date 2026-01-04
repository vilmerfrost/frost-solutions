// app/lib/integrations/sync/ConflictResolver.ts

import type {
 Conflict,
 ResolutionStrategy,
 SyncJob,
} from '@/types/integrations';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * ConflictResolver: Handle data conflicts during bidirectional sync
 *
 * Strategies:
 * - local_wins: Always prefer local (Frost) data
 * - remote_wins: Always prefer remote (Fortnox/Visma) data
 * - newest_wins: Compare timestamps and use newest
 * - manual: Flag for manual resolution
 */
export class ConflictResolver {
 private adminClient;

 constructor(private strategy: ResolutionStrategy = 'newest_wins') {
  this.adminClient = createAdminClient();
 }

 /**
  * Resolve conflict between local and remote data
  */
 resolve(
  localData: any,
  remoteData: any,
  resourceType: string
 ): {
  action: 'use_local' | 'use_remote' | 'merge' | 'skip';
  data?: any;
  reason: string;
 } {
  console.log('[ConflictResolver] 🔀 Resolving conflict:', {
   resourceType,
   strategy: this.strategy,
   hasLocal: !!localData,
   hasRemote: !!remoteData,
  });

  // No conflict if only one version exists
  if (!localData && remoteData) {
   return {
    action: 'use_remote',
    data: remoteData,
    reason: 'No local version exists',
   };
  }

  if (localData && !remoteData) {
   return {
    action: 'use_local',
    data: localData,
    reason: 'No remote version exists',
   };
  }

  // Apply resolution strategy
  switch (this.strategy) {
   case 'local_wins':
   case 'frost_wins':
    console.log('[ConflictResolver] 📌 Local wins strategy');
    return {
     action: 'use_local',
     data: localData,
     reason: 'Local wins strategy',
    };

   case 'remote_wins':
   case 'external_wins':
    console.log('[ConflictResolver] 📌 Remote wins strategy');
    return {
     action: 'use_remote',
     data: remoteData,
     reason: 'Remote wins strategy',
    };

   case 'newest_wins':
   case 'last_write_wins':
    return this.resolveByTimestamp(localData, remoteData);

   case 'manual':
    console.log('[ConflictResolver] 📌 Manual resolution required');
    return {
     action: 'skip',
     reason: 'Manual resolution required',
    };

   default:
    console.warn(
     '[ConflictResolver] ⚠️ Unknown strategy, defaulting to newest_wins'
    );
    return this.resolveByTimestamp(localData, remoteData);
  }
 }

 /**
  * Resolve by comparing timestamps
  */
 private resolveByTimestamp(
  localData: any,
  remoteData: any
 ): {
  action: 'use_local' | 'use_remote' | 'merge' | 'skip';
  data?: any;
  reason: string;
 } {
  const localTimestamp = new Date(
   localData.updated_at || localData.created_at
  );
  const remoteTimestamp = new Date(
   remoteData.ModifiedDate || remoteData.updated_at
  );

  console.log('[ConflictResolver] ⏱️ Comparing timestamps:', {
   local: localTimestamp.toISOString(),
   remote: remoteTimestamp.toISOString(),
  });

  if (localTimestamp > remoteTimestamp) {
   console.log('[ConflictResolver] ✅ Local is newer');
   return {
    action: 'use_local',
    data: localData,
    reason: `Local is newer (${localTimestamp.toISOString()})`,
   };
  } else {
   console.log('[ConflictResolver] ✅ Remote is newer');
   return {
    action: 'use_remote',
    data: remoteData,
    reason: `Remote is newer (${remoteTimestamp.toISOString()})`,
   };
  }
 }

 /**
  * Detect if conflict exists by comparing data
  */
 hasConflict(localData: any, remoteData: any): boolean {
  if (!localData || !remoteData) return false;

  // Check if critical fields differ
  const criticalFields = ['name', 'amount', 'status', 'date'];

  for (const field of criticalFields) {
   if (localData[field] !== remoteData[field]) {
    console.log('[ConflictResolver] ⚠️ Conflict detected in field:', field, {
     local: localData[field],
     remote: remoteData[field],
    });
    return true;
   }
  }

  return false;
 }

 /**
  * Compare two versions of a resource and return a list of conflicts.
  */
 async detectConflicts(
  frostData: any,
  externalData: any,
  syncConfig: any
 ): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];
  const fieldsToSync =
   syncConfig.sync_fields[frostData.resource_type] || Object.keys(frostData);

  for (const field of fieldsToSync) {
   // Note: 'mapFromFrost' needed here to compare apples with apples
   // e.g. frostData.total vs externalData.Total
   const frostValue = frostData[field];
   const externalValue = externalData[field]; // Assume externalData already mapped

   if (frostValue !== externalValue) {
    // Simple timestamp check (can be made more robust)
    const frostTimestamp = new Date(frostData.updated_at);
    const externalTimestamp = new Date(externalData.updated_at); // Assume mapped field

    if (
     Math.abs(frostTimestamp.getTime() - externalTimestamp.getTime()) >
     10000
    ) {
     // 10 second margin
     conflicts.push({
      field,
      frostValue,
      externalValue,
      timestamps: {
       frost: frostTimestamp,
       external: externalTimestamp,
      },
     });
    }
   }
  }

  return conflicts;
 }

 /**
  * Try to resolve conflicts automatically based on a strategy.
  * Returns conflicts that *could not* be resolved.
  */
 async autoResolve(
  conflicts: Conflict[],
  strategy: ResolutionStrategy
 ): Promise<{ resolved: Conflict[]; unresolved: Conflict[] }> {
  const unresolved: Conflict[] = [];
  const resolved: Conflict[] = [];

  for (const conflict of conflicts) {
   if (strategy === 'last_write_wins') {
    // 'resolved' means we've determined a winner
    resolved.push(conflict); // Winner determined by whoever writes the data
   } else if (strategy === 'frost_wins' || strategy === 'external_wins') {
    resolved.push(conflict); // Same here, strategy is simple
   } else {
    // Default: 'manual' or unknown strategy
    unresolved.push(conflict);
   }
  }

  return { resolved, unresolved };
 }

 /**
  * Log unresolved conflicts to database for manual handling.
  */
 async requestManualResolution(
  job: SyncJob,
  unresolvedConflicts: Conflict[]
 ): Promise<void> {
  await this.adminClient.from('sync_conflicts').insert({
   job_id: job.id,
   tenant_id: job.tenant_id,
   resource_type: job.resource_type,
   resource_id: job.resource_id,
   status: 'pending',
   conflict_details: { conflicts: unresolvedConflicts },
  });

  await this.adminClient
   .from('sync_jobs')
   .update({ status: 'requires_manual_resolution' })
   .eq('id', job.id);

  // TODO: Send in-app notification to user
 }
}

