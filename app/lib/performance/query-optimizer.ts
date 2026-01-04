// app/lib/performance/query-optimizer.ts
import { createLogger } from '@/lib/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('QueryOptimizer');

/**
 * Optimized query helper with automatic tenant scoping
 */
export class OptimizedQueryBuilder {
 constructor(
  private readonly db: SupabaseClient,
  private readonly tenantId: string
 ) {}

 /**
  * Build optimized query with tenant isolation and covering indexes
  */
 from(table: string) {
  const query = this.db.schema('app').from(table) as any
  return query.eq('tenant_id', this.tenantId)
 }

 /**
  * Optimized listing with pagination
  */
 async listWithPagination<T>(
  table: string,
  options: {
   limit?: number;
   offset?: number;
   orderBy?: string;
   orderDirection?: 'asc' | 'desc';
   filters?: Record<string, unknown>;
  } = {}
 ): Promise<{ data: T[]; count: number }> {
  const {
   limit = 50,
   offset = 0,
   orderBy = 'created_at',
   orderDirection = 'desc',
   filters = {},
  } = options;

  let query = this.from(table).select('*', { count: 'exact' });

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
   if (value !== undefined && value !== null) {
    query = query.eq(key, value);
   }
  });

  // Apply ordering and pagination
  query = query
   .order(orderBy, { ascending: orderDirection === 'asc' })
   .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
   logger.error('Query failed', error);
   throw error;
  }

  return {
   data: (data || []) as T[],
   count: count || 0,
  };
 }
}

/**
 * Batch processing helper for large datasets
 */
export class BatchProcessor {
 constructor(
  private readonly db: SupabaseClient,
  private readonly batchSize: number = 100
 ) {}

 /**
  * Process items in batches to avoid memory issues
  */
 async processBatch<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>
 ): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += this.batchSize) {
   const batch = items.slice(i, i + this.batchSize);
   const batchResults = await processor(batch);
   results.push(...batchResults);

   // Prevent event loop blocking
   if (i + this.batchSize < items.length) {
    await new Promise((resolve) => setImmediate(resolve));
   }
  }

  return results;
 }
}

