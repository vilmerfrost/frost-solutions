// app/lib/integrations/sync/IdempotencyManager.ts

import { createAdminClient } from '@/utils/supabase/admin';

/**
 * IdempotencyManager: Prevent duplicate sync operations
 *
 * Uses idempotency keys to ensure operations are only processed once,
 * even if called multiple times (e.g., webhook retries, manual retries).
 */
export class IdempotencyManager {
  private adminClient;

  constructor() {
    this.adminClient = createAdminClient();
  }

  /**
   * Generate idempotency key for a sync operation
   *
   * Format: {operation}_{resource_type}_{resource_id}_{direction}
   */
  generateKey(
    operation: string,
    resourceType: string,
    resourceId: string,
    direction: 'push' | 'pull'
  ): string {
    return `${operation}_${resourceType}_${resourceId}_${direction}`;
  }

  /**
   * Check if operation has already been processed
   *
   * @returns true if operation is a duplicate, false if new
   */
  async isDuplicate(
    tenantId: string,
    integrationId: string,
    idempotencyKey: string
  ): Promise<boolean> {
    console.log('[IdempotencyManager] 🔍 Checking for duplicates:', {
      tenantId,
      integrationId,
      key: idempotencyKey,
    });

    try {
      const { data, error } = await this.adminClient
        .from('sync_logs')
        .select('id, status, created_at')
        .eq('tenant_id', tenantId)
        .eq('integration_id', integrationId)
        .eq('metadata->>idempotency_key', idempotencyKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[IdempotencyManager] ❌ Query error:', error);
        return false; // Fail open - allow operation
      }

      if (data) {
        const age = Date.now() - new Date(data.created_at).getTime();
        const ageMinutes = Math.floor(age / 1000 / 60);

        console.log('[IdempotencyManager] ⚠️ Duplicate detected:', {
          logId: data.id,
          status: data.status,
          age: `${ageMinutes} minutes`,
        });

        // Only consider it a duplicate if completed within last 24 hours
        if (data.status === 'success' && age < 24 * 60 * 60 * 1000) {
          return true;
        }

        // If previous attempt failed, allow retry
        if (data.status === 'error' && age > 5 * 60 * 1000) {
          console.log(
            '[IdempotencyManager] ✅ Previous attempt failed, allowing retry'
          );
          return false;
        }
      }

      console.log('[IdempotencyManager] ✅ Operation is new');
      return false;
    } catch (error: any) {
      console.error('[IdempotencyManager] ❌ Exception:', error);
      return false; // Fail open
    }
  }
}

