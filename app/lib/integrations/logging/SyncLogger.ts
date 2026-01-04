// app/lib/integrations/logging/SyncLogger.ts

import { createAdminClient } from '@/utils/supabase/admin';

interface LogEntry {
 tenant_id: string;
 integration_id: string;
 operation: string;
 direction: 'push' | 'pull' | 'bidirectional';
 resource_type: string;
 resource_id: string;
 metadata?: Record<string, any>;
}

/**
 * SyncLogger: Comprehensive logging for all sync operations
 *
 * Logs to database table: sync_logs
 */
export class SyncLogger {
 private adminClient;

 constructor() {
  this.adminClient = createAdminClient();
 }

 /**
  * Start a new log entry
  */
 async startLog(entry: LogEntry): Promise<string> {
  console.log('[SyncLogger] 📝 Starting log entry:', {
   operation: entry.operation,
   resourceType: entry.resource_type,
   resourceId: entry.resource_id,
  });

  try {
   const { data, error } = await this.adminClient
    .from('sync_logs')
    .insert({
     ...entry,
     status: 'pending',
     retry_count: 0,
    })
    .select('id')
    .single();

   if (error) {
    console.error('[SyncLogger] ❌ Failed to create log:', error);
    throw error;
   }

   console.log('[SyncLogger] ✅ Log created:', data.id);
   return data.id;
  } catch (error: any) {
   console.error('[SyncLogger] ❌ Exception:', error);
   throw error;
  }
 }

 /**
  * Complete a log entry with success or error
  */
 async completeLog(
  logId: string,
  status: 'success' | 'error',
  durationMs: number,
  errorDetails?: { error_code?: string; error_message?: string }
 ): Promise<void> {
  console.log('[SyncLogger] ✅ Completing log:', {
   logId,
   status,
   duration: `${durationMs}ms`,
  });

  try {
   await this.adminClient
    .from('sync_logs')
    .update({
     status,
     duration_ms: durationMs,
     error_code: errorDetails?.error_code,
     error_message: errorDetails?.error_message,
    })
    .eq('id', logId);

   console.log('[SyncLogger] ✅ Log updated');
  } catch (error: any) {
   console.error('[SyncLogger] ❌ Failed to update log:', error);
   // Don't throw - logging failure should not break sync
  }
 }
}

