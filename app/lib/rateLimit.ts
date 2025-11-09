// app/lib/rateLimit.ts

/**
 * Rate Limiting per Tenant and Route
 * Based on GPT-5 implementation
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { RateLimitError } from './ocr/errors';

/**
 * Assert rate limit for tenant + route
 * Default: 10 requests per minute
 */
export async function assertRateLimit(
  tenantId: string,
  route: string,
  limit: number = 10
): Promise<void> {
  const admin = createAdminClient();
  const oneMinAgo = new Date(Date.now() - 60_000).toISOString();

  try {
    // Use app schema if it exists, otherwise public
    const schema = 'app';
    
    const { count, error } = await admin
      .schema(schema)
      .from('api_rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('route', route)
      .gte('ts', oneMinAgo);

    if (error) {
      console.error('[RateLimit] Database error:', error);
      // Don't block on database errors, but log them
      return;
    }

    if ((count ?? 0) >= limit) {
      throw new RateLimitError(
        `Rate limit exceeded: ${limit} requests per minute`,
        Math.ceil(60 - (Date.now() - new Date(oneMinAgo).getTime()) / 1000)
      );
    }

    // Record this request
    await admin
      .schema(schema)
      .from('api_rate_limits')
      .insert({
        tenant_id: tenantId,
        route,
        ts: new Date().toISOString(),
      });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    // On other errors, log but don't block
    console.error('[RateLimit] Error checking rate limit:', error);
  }
}

