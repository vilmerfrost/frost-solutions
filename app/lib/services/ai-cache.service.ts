// app/lib/services/ai-cache.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import crypto from 'crypto';

const logger = createLogger('AiCacheService');

/**
 * Cache AI responses to reduce costs
 * Uses hashed prompts as cache keys
 */
export class AiCacheService {
 private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

 constructor(private readonly db: SupabaseClient) {}

 /**
  * Get cached response
  */
 async get(prompt: string, tenantId: string): Promise<string | null> {
  const key = this.generateKey(prompt, tenantId);
  logger.debug('Checking cache', { key: key.slice(0, 16) });

  const { data } = await this.db
   .schema('app')
   .from('ai_response_cache')
   .select('*')
   .eq('key', key)
   .eq('tenant_id', tenantId)
   .gt('expires_at', new Date().toISOString())
   .maybeSingle();

  if (data) {
   logger.info('Cache hit', {
    key: key.slice(0, 16),
    tokensSaved: data.tokens_saved,
   });
   return data.response as string;
  }

  logger.debug('Cache miss', { key: key.slice(0, 16) });
  return null;
 }

 /**
  * Store response in cache
  */
 async set(
  prompt: string,
  response: string,
  tokensSaved: number,
  tenantId: string
 ): Promise<void> {
  const key = this.generateKey(prompt, tenantId);
  const expiresAt = new Date(Date.now() + this.TTL);

  logger.debug('Storing in cache', {
   key: key.slice(0, 16),
   responseLength: response.length,
   tokensSaved,
  });

  await this.db.schema('app').from('ai_response_cache').upsert({
   tenant_id: tenantId,
   cache_key: key,
   response,
   tokens_saved: tokensSaved,
   expires_at: expiresAt.toISOString(),
  });

  logger.info('Cached response', { key: key.slice(0, 16) });
 }

 /**
  * Clear expired cache entries
  */
 async clearExpired(): Promise<void> {
  logger.info('Clearing expired cache entries');

  const { error } = await this.db
   .schema('app')
   .from('ai_response_cache')
   .delete()
   .lt('expires_at', new Date().toISOString());

  if (error) {
   logger.error('Failed to clear expired entries', error);
  } else {
   logger.info('Expired entries cleared');
  }
 }

 /**
  * Get cache statistics
  */
 async getStats(tenantId: string): Promise<{
  totalEntries: number;
  totalTokensSaved: number;
  estimatedCostSaved: number;
 }> {
  const { data } = await this.db
   .schema('app')
   .from('ai_response_cache')
   .select('tokens_saved')
   .eq('tenant_id', tenantId);

  const totalEntries = data?.length ?? 0;
  const totalTokensSaved = data?.reduce((sum, entry) => sum + (entry.tokens_saved || 0), 0) ?? 0;

  // Estimate cost saved (assuming $0.002 per 1K tokens)
  const estimatedCostSaved = (totalTokensSaved / 1000) * 0.002;

  return {
   totalEntries,
   totalTokensSaved,
   estimatedCostSaved,
  };
 }

 /**
  * Generate cache key from prompt
  */
 private generateKey(prompt: string, tenantId: string): string {
  const content = `${tenantId}:${prompt}`;
  return crypto.createHash('sha256').update(content).digest('hex');
 }
}

