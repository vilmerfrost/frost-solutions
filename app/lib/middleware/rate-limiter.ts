// app/lib/middleware/rate-limiter.ts
import { RateLimitError } from '@/lib/utils/errors';
import { createLogger } from '@/lib/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('RateLimiter');

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limiter with per-tenant limits
 * Stores limit data in database for distributed systems
 */
export class RateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor(private readonly db: SupabaseClient) {
    // Define rate limits per endpoint
    this.configs.set('ai-chat', {
      maxRequests: 100, // 100 requests
      windowMs: 60 * 60 * 1000, // per hour
    });
    this.configs.set('ai-context', {
      maxRequests: 1000,
      windowMs: 60 * 60 * 1000,
    });
    this.configs.set('factoring-offers', {
      maxRequests: 50,
      windowMs: 60 * 60 * 1000, // per hour
    });
  }

  /**
   * Check and increment rate limit
   */
  async checkLimit(tenantId: string, endpoint: string): Promise<void> {
    const config = this.configs.get(endpoint);
    if (!config) {
      logger.warn('No rate limit config for endpoint', { endpoint });
      return;
    }

    logger.debug('Checking rate limit', { tenantId, endpoint });

    // Get or create rate limit record
    const { data: existing } = await this.db
      .schema('app')
      .from('rate_limits')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('endpoint', endpoint)
      .maybeSingle();

    const now = new Date();
    const windowStart = existing?.window_start ? new Date(existing.window_start) : now;
    const windowAge = now.getTime() - windowStart.getTime();

    // Check if window has expired
    if (windowAge >= config.windowMs) {
      // Reset window
      await this.db
        .schema('app')
        .from('rate_limits')
        .upsert({
          tenant_id: tenantId,
          endpoint,
          request_count: 1,
          window_start: now.toISOString(),
        });
      logger.debug('Rate limit window reset', { tenantId, endpoint });
      return;
    }

    // Check if limit exceeded
    const currentCount = existing?.request_count ?? 0;
    if (currentCount >= config.maxRequests) {
      const retryAfter = Math.ceil((config.windowMs - windowAge) / 1000);
      logger.warn('Rate limit exceeded', {
        tenantId,
        endpoint,
        currentCount,
        maxRequests: config.maxRequests,
        retryAfter,
      });
      throw new RateLimitError(retryAfter, {
        tenantId,
        endpoint,
        currentCount,
        maxRequests: config.maxRequests,
      });
    }

    // Increment counter
    await this.db
      .schema('app')
      .from('rate_limits')
      .upsert({
        tenant_id: tenantId,
        endpoint,
        request_count: currentCount + 1,
        window_start: windowStart.toISOString(),
      });

    logger.debug('Rate limit incremented', {
      tenantId,
      endpoint,
      count: currentCount + 1,
      limit: config.maxRequests,
    });
  }
}

