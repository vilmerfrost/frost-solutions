# 🎯 PROMPT FÖR DEEPSEEK THINKING: PERFORMANCE & RATE LIMITING

## ⚡ UPPGIFT: PERFORMANCE-OPTIMERAD SYNC IMPLEMENTATION

### Kontext

Du är Deepseek Thinking och ska implementera **performance-optimerad sync** för Fortnox/Visma integration. Du har Perplexity's research guide, men nu ska du fokusera på **prestanda, rate limiting och background jobs** för att hantera stora datasets effektivt.

### Teknisk Stack

- **Framework**: Next.js 16 App Router
- **Database**: Supabase (PostgreSQL)
- **Background Jobs**: Supabase Edge Functions eller pg_cron
- **Queue**: PostgreSQL-based queue (optimized for performance)

### Perplexity Research Guide

Du har tillgång till komplett research guide med:
- ✅ Rate limits (Fortnox: 300 req/min, Visma: varies)
- ✅ API endpoints och pagination
- ✅ Error handling patterns
- ✅ Background job strategies

### Dina Specifika Uppgifter

#### 1. **Rate Limiting Implementation** (Högsta prioritet)
- Implementera rate limiter för Fortnox (300 requests/minute)
- Implementera rate limiter för Visma (dynamisk detection)
- Queue system för rate limit compliance
- Request batching för att maximera throughput
- Priority queue för important syncs

#### 2. **Background Jobs Optimization** (Högsta prioritet)
- Designa efficient background job system
- Batch processing för bulk syncs (100+ invoices)
- Parallel processing för multiple tenants
- Job prioritization (manual sync > auto sync)
- Job deduplication för att undvika duplicate work

#### 3. **Performance Optimization** (Hög prioritet)
- Incremental sync (delta sync) för att minimera API calls
- Caching strategies för frequently accessed data
- Database query optimization (indexes, batch queries)
- Connection pooling för API clients
- Request compression för large payloads

#### 4. **Batch Processing** (Hög prioritet)
- Batch API calls (Fortnox supports batch endpoints?)
- Group sync jobs by tenant/provider
- Parallel batch processing
- Progress tracking för large batches
- Partial batch success handling

#### 5. **Monitoring & Metrics** (Hög prioritet)
- Performance metrics (sync duration, API call count)
- Rate limit tracking (requests/minute)
- Queue depth monitoring
- Throughput metrics (invoices synced/hour)
- Alerting för performance degradation

### Specifika Performance-Krav

1. **Throughput**: Sync 1000 invoices inom 10 minuter
2. **Rate Limit Compliance**: Aldrig överskrida rate limits
3. **Memory Efficiency**: Hantera stora datasets utan memory issues
4. **Database Performance**: Optimized queries för sync operations
5. **API Efficiency**: Minimera antal API calls (batch, delta sync)

### Önskad Output

1. **Rate Limiter Implementation**
   ```typescript
   export class RateLimiter {
     async execute<T>(fn: () => Promise<T>): Promise<T>
     getRemainingRequests(): number
     getResetTime(): Date
   }
   ```

2. **Background Job System**
   ```typescript
   export class SyncJobProcessor {
     async processBatch(jobs: SyncJob[]): Promise<BatchResult>
     async processParallel(jobs: SyncJob[], concurrency: number): Promise<void>
     async prioritizeJobs(jobs: SyncJob[]): SyncJob[]
   }
   ```

3. **Batch Processor**
   ```typescript
   export class BatchSyncProcessor {
     async syncBatchInvoices(invoiceIds: string[]): Promise<BatchSyncResult>
     async syncBatchCustomers(customerIds: string[]): Promise<BatchSyncResult>
   }
   ```

4. **Performance Monitor**
   ```typescript
   export class PerformanceMonitor {
     trackSyncDuration(operation: string, duration: number): void
     trackAPICall(provider: string, endpoint: string): void
     getMetrics(): PerformanceMetrics
   }
   ```

5. **Caching Strategy**
   ```typescript
   export class SyncCache {
     async getCachedCustomer(customerId: string): Promise<Customer | null>
     async cacheCustomer(customer: Customer, ttl: number): Promise<void>
     async invalidateCache(pattern: string): Promise<void>
   }
   ```

### Performance Benchmarks

- **Small Batch** (10 invoices): < 30 seconds
- **Medium Batch** (100 invoices): < 5 minutes
- **Large Batch** (1000 invoices): < 10 minutes
- **Rate Limit**: Never exceed 300 req/min for Fortnox
- **Memory**: < 100MB for 1000 invoice sync

### Exempel Implementation

```typescript
// Exempel: Rate-limited batch sync med performance tracking
export class OptimizedSyncProcessor {
  private rateLimiter: RateLimiter;
  private performanceMonitor: PerformanceMonitor;

  async syncBatchInvoices(
    invoiceIds: string[],
    provider: 'fortnox' | 'visma'
  ): Promise<BatchSyncResult> {
    const startTime = Date.now();
    
    // Batch invoices into chunks (respect rate limits)
    const chunks = this.chunkArray(invoiceIds, this.getChunkSize(provider));
    
    const results: SyncResult[] = [];
    
    for (const chunk of chunks) {
      // Process chunk with rate limiting
      const chunkResults = await this.rateLimiter.execute(async () => {
        return Promise.all(
          chunk.map(id => this.syncInvoice(id, provider))
        );
      });
      
      results.push(...chunkResults);
      
      // Track performance
      this.performanceMonitor.trackAPICall(provider, 'batch_sync');
    }
    
    const duration = Date.now() - startTime;
    this.performanceMonitor.trackSyncDuration('batch_sync', duration);
    
    return {
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration
    };
  }
}
```

### Fokusområden

- ✅ **Performance**: Maximera throughput, minimera latency
- ✅ **Rate Limiting**: Aldrig överskrida API limits
- ✅ **Scalability**: Hantera stora datasets effektivt
- ✅ **Monitoring**: Track performance metrics

### Viktigt

- Fokusera på praktiska optimeringar
- Benchmark allt (measure before/after)
- Tänk på production performance
- Hantera rate limits gracefully

---

**Fokus**: Performance optimization, rate limiting, batch processing, background jobs. Lösningen ska vara snabb, effektiv och respektera API limits.

