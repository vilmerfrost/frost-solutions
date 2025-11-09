// app/lib/integrations/sync/performance/SyncCache.ts

import { createAdminClient } from '@/utils/supabase/admin';

export class SyncCache {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private supabase: ReturnType<typeof createAdminClient>;

  constructor(supabase: ReturnType<typeof createAdminClient>) {
    this.supabase = supabase;
  }

  async getCachedCustomer(customerId: string): Promise<any | null> {
    const key = `customer:${customerId}`;
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    // Fallback to database cache
    const { data } = await this.supabase
      .from('api_cache')
      .select('value')
      .eq('key', key)
      .gt('expires_at', new Date())
      .maybeSingle();

    if (data) {
      this.cache.set(key, {
        value: data.value,
        expires: new Date(data.expires_at).getTime(),
      });
      return data.value;
    }

    return null;
  }

  async cacheCustomer(customer: any, ttl: number = 300): Promise<void> {
    const key = `customer:${customer.id}`;
    const expires = Date.now() + ttl * 1000;

    // Memory cache
    this.cache.set(key, { value: customer, expires });

    // Database cache
    await this.supabase.from('api_cache').upsert([
      {
        key,
        value: customer,
        expires_at: new Date(expires),
        updated_at: new Date(),
      },
    ]);
  }

  async getCachedInvoice(invoiceId: string): Promise<any | null> {
    const key = `invoice:${invoiceId}`;
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    return null;
  }

  async cacheInvoice(invoice: any, ttl: number = 300): Promise<void> {
    const key = `invoice:${invoice.id}`;
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value: invoice, expires });
  }

  async invalidateCache(pattern: string): Promise<void> {
    // Invalidate memory cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }

    // Invalidate database cache
    await this.supabase.from('api_cache').delete().like('key', `%${pattern}%`);
  }

  // Garbage collection for expired cache entries
  async cleanupExpired(): Promise<void> {
    const now = Date.now();

    // Clean memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires <= now) {
        this.cache.delete(key);
      }
    }

    // Clean database cache
    await this.supabase
      .from('api_cache')
      .delete()
      .lt('expires_at', new Date());
  }
}

