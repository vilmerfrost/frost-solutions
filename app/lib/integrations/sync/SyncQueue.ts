// app/lib/integrations/sync/SyncQueue.ts

import { createAdminClient } from '@/utils/supabase/admin';
import type { SyncJob, SyncJobInput } from '@/types/integrations';

/**
 * SyncQueue: Reliable queue system for sync operations
 *
 * Features:
 * - Priority-based processing
 * - Automatic retry with exponential backoff
 * - Dead letter queue for failed jobs
 * - Concurrent processing with rate limiting
 */
export class SyncQueue {
 private adminClient;
 private processing = false;

 constructor() {
  this.adminClient = createAdminClient();
 }

 /**
  * Enqueue a sync job
  */
 async enqueue(
  job: Omit<
   SyncJob,
   'id' | 'status' | 'retry_count' | 'created_at' | 'updated_at'
  >
 ): Promise<string> {
  console.log('[SyncQueue] ➕ Enqueueing job:', {
   operation: job.action,
   resourceType: job.resource_type,
   resourceId: job.resource_id,
   priority: job.priority,
  });

  try {
   const { data, error } = await this.adminClient
    .from('sync_queue')
    .insert({
     ...job,
     status: 'pending',
     retry_count: 0,
    })
    .select('id')
    .single();

   if (error) {
    console.error('[SyncQueue] ❌ Failed to enqueue:', error);
    throw new Error(`Enqueue failed: ${error.message}`);
   }

   console.log('[SyncQueue] ✅ Job enqueued:', data.id);
   return data.id;
  } catch (error: any) {
   console.error('[SyncQueue] ❌ Exception:', error);
   throw error;
  }
 }

 /**
  * Process pending jobs
  */
 async processQueue(maxConcurrent: number = 5): Promise<void> {
  if (this.processing) {
   console.log('[SyncQueue] ⏸️ Already processing');
   return;
  }

  this.processing = true;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[SyncQueue] 🔄 STARTING QUEUE PROCESSING');
  console.log('[SyncQueue] Max concurrent:', maxConcurrent);

  try {
   // Get pending jobs (ordered by priority DESC, created_at ASC)
   // Use RPC function for atomic locking
   const { data: jobs, error } = await this.adminClient.rpc(
    'get_and_lock_next_sync_job',
    { max_jobs: maxConcurrent }
   );

   if (error) {
    console.error('[SyncQueue] ❌ Failed to fetch jobs:', error);
    return;
   }

   console.log('[SyncQueue] 📋 Found pending jobs:', jobs?.length || 0);

   if (!jobs || jobs.length === 0) {
    console.log('[SyncQueue] ✅ Queue is empty');
    return;
   }

   // Process jobs concurrently
   await Promise.all(jobs.map((job: SyncJob) => this.processJob(job)));

   console.log('[SyncQueue] ✅ Batch processing completed');
  } catch (error: any) {
   console.error('[SyncQueue] ❌ Queue processing error:', error);
  } finally {
   this.processing = false;
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
 }

 /**
  * Process a single job
  */
 private async processJob(job: SyncJob): Promise<void> {
  console.log('[SyncQueue] 🔧 Processing job:', job.id);

  // Mark as processing (already done by RPC, but ensure)
  await this.adminClient
   .from('sync_queue')
   .update({ status: 'processing' })
   .eq('id', job.id);

  try {
   // TODO: Call appropriate sync handler based on job.action
   // This would call AccountingSyncOrchestrator methods

   // For now, simulate processing
   await new Promise((resolve) => setTimeout(resolve, 1000));

   // Mark as completed
   await this.adminClient
    .from('sync_queue')
    .update({
     status: 'completed',
     updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);

   console.log('[SyncQueue] ✅ Job completed:', job.id);
  } catch (error: any) {
   console.error('[SyncQueue] ❌ Job failed:', {
    jobId: job.id,
    error: error.message,
   });

   // Increment retry count
   const newRetryCount = job.retry_count + 1;
   const maxRetries = 3;

   if (newRetryCount < maxRetries) {
    // Retry with exponential backoff
    const backoffSeconds = Math.pow(2, newRetryCount) * 60; // 2min, 4min, 8min
    const retryAt = new Date(Date.now() + backoffSeconds * 1000);

    await this.adminClient
     .from('sync_queue')
     .update({
      status: 'pending',
      retry_count: newRetryCount,
      last_error: error.message,
      updated_at: new Date().toISOString(),
      payload: {
       ...job.payload,
       retry_at: retryAt.toISOString(),
      },
     })
     .eq('id', job.id);

    console.log('[SyncQueue] 🔄 Job scheduled for retry:', {
     jobId: job.id,
     retryCount: newRetryCount,
     retryAt: retryAt.toISOString(),
    });
   } else {
    // Move to dead letter queue
    await this.adminClient
     .from('sync_queue')
     .update({
      status: 'failed',
      last_error: error.message,
      updated_at: new Date().toISOString(),
     })
     .eq('id', job.id);

    console.log('[SyncQueue] ☠️ Job moved to dead letter queue:', job.id);
   }
  }
 }

 /**
  * Get next job from queue (used by worker)
  * This is the heart of our concurrency handling.
  */
 async getNextJob(): Promise<SyncJob | null> {
  // 1. Get ONE job, lock it, and skip those already locked
  // This is an atomic operation. Two workers can *never* get the same job.
  const { data: job, error } = await this.adminClient.rpc(
   'get_and_lock_next_sync_job',
   { max_jobs: 1 }
  );

  if (error) {
   console.error('[SyncQueue] ❌ Failed to get next job:', error);
   return null;
  }

  if (job && job.length > 0) {
   const lockedJob = job[0] as SyncJob;

   // 2. Try to acquire a resource lock (to handle webhook vs manual sync)
   const lockId = `${lockedJob.tenant_id}:${lockedJob.provider}:${lockedJob.resource_type}:${lockedJob.resource_id}`;

   const { error: lockError } = await this.adminClient
    .from('resource_locks')
    .insert({
     id: lockId,
     job_id: lockedJob.id,
    });

   if (lockError) {
    // Lock already exists! Someone else is processing this resource.
    // Reset job to 'pending' (or increase priority) and try again later.
    await this.adminClient
     .from('sync_queue')
     .update({ status: 'pending' })
     .eq('id', lockedJob.id);
    return null;
   }

   return lockedJob;
  }

  return null;
 }

 async releaseJob(job: SyncJob, newStatus: string, lastError?: string) {
  // 1. Release resource lock
  const lockId = `${job.tenant_id}:${job.provider}:${job.resource_type}:${job.resource_id}`;
  await this.adminClient.from('resource_locks').delete().eq('id', lockId);

  // 2. Update job status
  await this.adminClient
   .from('sync_queue')
   .update({
    status: newStatus,
    last_error: lastError,
    retry_count: newStatus === 'failed' ? (job.retry_count || 0) + 1 : 0,
    updated_at: new Date().toISOString(),
   })
   .eq('id', job.id);
 }
}

