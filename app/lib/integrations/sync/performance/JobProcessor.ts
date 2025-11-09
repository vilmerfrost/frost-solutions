// app/lib/integrations/sync/performance/JobProcessor.ts

import { createAdminClient } from '@/utils/supabase/admin';
import { PerformanceRateLimiter } from './RateLimiter';
import { PerformanceMonitor } from './PerformanceMonitor';
import { SyncCache } from './SyncCache';
import type { AccountingProvider } from '@/types/integrations';

export interface SyncJob {
  id: string;
  type: 'invoice' | 'customer' | 'employee';
  operation: 'create' | 'update' | 'sync';
  provider: AccountingProvider;
  payload: any;
  priority: number; // 1-10, higher = more important
  tenantId: string;
  createdAt: Date;
  scheduledFor?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface BatchResult {
  success: number;
  failed: number;
  total: number;
  duration: number;
  errors: Array<{ jobId: string; error: string }>;
}

export class SyncJobProcessor {
  private rateLimiter: PerformanceRateLimiter;
  private performanceMonitor: PerformanceMonitor;
  private cache: SyncCache;
  private isProcessing: boolean = false;
  private concurrentWorkers: number = 3;
  private supabase: ReturnType<typeof createAdminClient>;

  constructor(supabase: ReturnType<typeof createAdminClient>) {
    this.supabase = supabase;
    this.rateLimiter = new PerformanceRateLimiter(supabase);
    this.performanceMonitor = new PerformanceMonitor(supabase);
    this.cache = new SyncCache(supabase);
  }

  async processBatch(jobs: SyncJob[]): Promise<BatchResult> {
    const startTime = Date.now();
    const results: Array<{ success: boolean; error?: string }> = [];

    // Group jobs by provider and priority
    const groupedJobs = this.groupAndPrioritizeJobs(jobs);

    // Process groups in parallel with concurrency control
    for (const [provider, priorityGroups] of groupedJobs) {
      for (const jobs of priorityGroups) {
        const chunkedJobs = this.chunkArray(jobs, 10); // Process in chunks of 10

        for (const chunk of chunkedJobs) {
          if (!this.isProcessing) break;

          const chunkResults = await Promise.allSettled(
            chunk.map((job) => this.processSingleJob(job))
          );

          results.push(
            ...chunkResults.map((result) =>
              result.status === 'fulfilled'
                ? { success: true }
                : { success: false, error: result.reason.message }
            )
          );
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total: results.length,
      duration,
      errors: results
        .filter((r) => !r.success)
        .map((r, i) => ({ jobId: jobs[i].id, error: r.error! })),
    };
  }

  async processParallel(
    jobs: SyncJob[],
    concurrency: number = 3
  ): Promise<void> {
    const queue = [...jobs];
    const workers = Array(concurrency)
      .fill(null)
      .map(async (_, workerId) => {
        while (queue.length > 0 && this.isProcessing) {
          const job = queue.shift();
          if (job) {
            try {
              await this.processSingleJob(job);
            } catch (error) {
              console.error(`Worker ${workerId} failed on job ${job.id}:`, error);
            }
          }
        }
      });
    await Promise.all(workers);
  }

  prioritizeJobs(jobs: SyncJob[]): SyncJob[] {
    return jobs.sort((a, b) => {
      // Manual syncs have highest priority
      if (a.priority !== b.priority) return b.priority - a.priority;

      // Then by type (customers before invoices)
      const typePriority = { customer: 3, employee: 2, invoice: 1 };
      if (a.type !== b.type)
        return typePriority[b.type] - typePriority[a.type];

      // Finally by creation time
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }

  private groupAndPrioritizeJobs(
    jobs: SyncJob[]
  ): Map<AccountingProvider, SyncJob[][]> {
    const grouped = new Map<AccountingProvider, SyncJob[]>();

    // Group by provider
    jobs.forEach((job) => {
      const key = job.provider;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(job);
    });

    // Prioritize within each group and chunk by priority
    const result = new Map<AccountingProvider, SyncJob[][]>();
    for (const [provider, providerJobs] of grouped) {
      const prioritized = this.prioritizeJobs(providerJobs);
      const priorityGroups = this.chunkByPriority(prioritized);
      result.set(provider, priorityGroups);
    }

    return result;
  }

  private chunkByPriority(jobs: SyncJob[]): SyncJob[][] {
    const groups: SyncJob[][] = [];
    let currentGroup: SyncJob[] = [];
    let currentPriority = jobs[0]?.priority;

    jobs.forEach((job) => {
      if (job.priority !== currentPriority) {
        if (currentGroup.length > 0) groups.push(currentGroup);
        currentGroup = [];
        currentPriority = job.priority;
      }
      currentGroup.push(job);
    });

    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }

  private async processSingleJob(job: SyncJob): Promise<void> {
    const startTime = Date.now();

    try {
      await this.rateLimiter.execute(job.provider, job.type, async () => {
        switch (job.type) {
          case 'invoice':
            await this.syncInvoice(job);
            break;
          case 'customer':
            await this.syncCustomer(job);
            break;
          case 'employee':
            await this.syncEmployee(job);
            break;
        }
      });

      await this.performanceMonitor.trackSyncDuration(
        job.type,
        Date.now() - startTime,
        job.provider
      );
    } catch (error) {
      await this.handleJobError(job, error);
      throw error;
    }
  }

  private async syncInvoice(job: SyncJob): Promise<void> {
    const { payload } = job;

    // Check cache first
    const cached = await this.cache.getCachedInvoice(payload.invoiceId);
    if (cached && cached.updatedAt >= payload.updatedAt) {
      return; // No changes needed
    }

    // Sync to provider
    // ... provider-specific sync logic

    await this.cache.cacheInvoice(payload, 300); // Cache for 5 minutes
  }

  private async syncCustomer(job: SyncJob): Promise<void> {
    // Implementation for customer sync
  }

  private async syncEmployee(job: SyncJob): Promise<void> {
    // Implementation for employee sync
  }

  private async handleJobError(job: SyncJob, error: any): Promise<void> {
    job.retryCount++;

    if (job.retryCount >= job.maxRetries) {
      await this.markJobAsFailed(job, error);
    } else {
      // Exponential backoff
      const backoffMs = Math.min(1000 * Math.pow(2, job.retryCount), 300000);
      job.scheduledFor = new Date(Date.now() + backoffMs);
      await this.requeueJob(job);
    }
  }

  private async markJobAsFailed(job: SyncJob, error: any): Promise<void> {
    await this.supabase
      .from('sync_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date(),
      })
      .eq('id', job.id);
  }

  private async requeueJob(job: SyncJob): Promise<void> {
    await this.supabase
      .from('sync_jobs')
      .update({
        retry_count: job.retryCount,
        scheduled_for: job.scheduledFor,
        updated_at: new Date(),
      })
      .eq('id', job.id);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  start(): void {
    this.isProcessing = true;
  }

  stop(): void {
    this.isProcessing = false;
  }
}

