// app/lib/integrations/sync/performance/BatchProcessor.ts

import { createAdminClient } from '@/utils/supabase/admin';
import { PerformanceRateLimiter } from './RateLimiter';
import { PerformanceMonitor } from './PerformanceMonitor';
import type { BatchSyncResult, AccountingProvider } from '@/types/integrations';

export class BatchSyncProcessor {
  private rateLimiter: PerformanceRateLimiter;
  private performanceMonitor: PerformanceMonitor;
  private supabase: ReturnType<typeof createAdminClient>;

  constructor(supabase: ReturnType<typeof createAdminClient>) {
    this.supabase = supabase;
    this.rateLimiter = new PerformanceRateLimiter(supabase);
    this.performanceMonitor = new PerformanceMonitor(supabase);
  }

  async syncBatchInvoices(
    invoiceIds: string[],
    provider: AccountingProvider
  ): Promise<BatchSyncResult> {
    const startTime = Date.now();
    const results: boolean[] = [];

    // Use incremental sync - only sync changed invoices
    const invoicesToSync = await this.getChangedInvoices(invoiceIds, provider);

    console.log(
      `Syncing ${invoicesToSync.length} changed invoices of ${invoiceIds.length} total`
    );

    // Batch into optimal chunk sizes
    const chunks = this.chunkArray(
      invoicesToSync,
      this.getOptimalChunkSize(provider)
    );

    for (const chunk of chunks) {
      if (
        this.rateLimiter.getRemainingRequests(provider, 'invoice') <
        chunk.length
      ) {
        // Wait for rate limit reset if needed
        const resetTime = this.rateLimiter.getResetTime(provider, 'invoice');
        const waitTime = resetTime.getTime() - Date.now();
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      const chunkResults = await Promise.allSettled(
        chunk.map((invoiceId) =>
          this.rateLimiter.execute(provider, 'invoice', () =>
            this.syncSingleInvoice(invoiceId, provider)
          )
        )
      );

      results.push(
        ...chunkResults.map((result) => result.status === 'fulfilled')
      );

      // Track performance
      this.performanceMonitor.trackAPICall(provider, 'batch_invoice_sync');
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(Boolean).length;

    return {
      success: successCount,
      failed: results.length - successCount,
      total: results.length,
      duration,
      throughput: results.length / (duration / 1000),
      rateLimitUsage: (results.length / this.getRateLimit(provider)) * 100,
    };
  }

  async syncBatchCustomers(
    customerIds: string[],
    provider: AccountingProvider
  ): Promise<BatchSyncResult> {
    const startTime = Date.now();

    // Use connection pooling for parallel requests
    const pool = new ConnectionPool(5); // 5 concurrent connections

    const results = await pool.execute(
      customerIds.map((id) => ({
        execute: () =>
          this.rateLimiter.execute(provider, 'customer', () =>
            this.syncSingleCustomer(id, provider)
          ),
      }))
    );

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;

    return {
      success: successCount,
      failed: results.length - successCount,
      total: results.length,
      duration,
      throughput: results.length / (duration / 1000),
      rateLimitUsage: (results.length / this.getRateLimit(provider)) * 100,
    };
  }

  private async getChangedInvoices(
    invoiceIds: string[],
    provider: AccountingProvider
  ): Promise<string[]> {
    // Only sync invoices that have changed since last sync
    const { data: lastSync } = await this.supabase
      .from('sync_states')
      .select('last_sync_time')
      .eq('provider', provider)
      .eq('entity_type', 'invoice')
      .maybeSingle();

    const { data: changedInvoices } = await this.supabase
      .from('invoices')
      .select('id')
      .in('id', invoiceIds)
      .gt('updated_at', lastSync?.last_sync_time || new Date(0));

    return changedInvoices?.map((inv) => inv.id) || [];
  }

  private getOptimalChunkSize(provider: AccountingProvider): number {
    // Dynamic chunk sizing based on rate limits and performance
    const baseSizes = { fortnox: 10, visma: 5 };
    const remaining = this.rateLimiter.getRemainingRequests(
      provider,
      'invoice'
    );

    return Math.min(
      baseSizes[provider],
      Math.max(1, Math.floor(remaining * 0.1))
    ); // Use 10% of remaining
  }

  private getRateLimit(provider: AccountingProvider): number {
    return provider === 'fortnox' ? 300 : 200;
  }

  private async syncSingleInvoice(
    invoiceId: string,
    provider: AccountingProvider
  ): Promise<void> {
    // Implementation for single invoice sync
    const invoice = await this.getInvoiceData(invoiceId);

    if (provider === 'fortnox') {
      await this.syncToFortnox(invoice);
    } else {
      await this.syncToVisma(invoice);
    }

    // Update sync state
    await this.updateLastSync(provider, 'invoice');
  }

  private async syncSingleCustomer(
    customerId: string,
    provider: AccountingProvider
  ): Promise<void> {
    // Implementation for single customer sync
  }

  private async getInvoiceData(invoiceId: string): Promise<any> {
    const { data } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    return data;
  }

  private async syncToFortnox(invoice: any): Promise<void> {
    // Implementation
  }

  private async syncToVisma(invoice: any): Promise<void> {
    // Implementation
  }

  private async updateLastSync(
    provider: AccountingProvider,
    entityType: string
  ): Promise<void> {
    await this.supabase.from('sync_states').upsert([
      {
        provider,
        entity_type: entityType,
        last_sync_time: new Date(),
      },
    ]);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Connection pool for parallel processing
class ConnectionPool {
  private queue: Array<{
    execute: Function;
    resolve: Function;
    reject: Function;
  }> = [];
  private activeWorkers = 0;

  constructor(private maxConnections: number) {}

  async execute<T>(
    tasks: Array<{ execute: () => Promise<T> }>
  ): Promise<Array<{ success: boolean; result?: T; error?: string }>> {
    return new Promise((resolve) => {
      const results: Array<{
        success: boolean;
        result?: T;
        error?: string;
      }> = [];
      let completed = 0;

      tasks.forEach((task, index) => {
        this.queue.push({
          execute: task.execute,
          resolve: (result: T) => {
            results[index] = { success: true, result };
            completed++;
            if (completed === tasks.length) resolve(results);
            this.processQueue();
          },
          reject: (error: any) => {
            results[index] = { success: false, error: error.message };
            completed++;
            if (completed === tasks.length) resolve(results);
            this.processQueue();
          },
        });
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.queue.length > 0 && this.activeWorkers < this.maxConnections) {
      const task = this.queue.shift()!;
      this.activeWorkers++;

      task
        .execute()
        .then(task.resolve)
        .catch(task.reject)
        .finally(() => {
          this.activeWorkers--;
          this.processQueue();
        });
    }
  }
}

