// app/lib/ai/cache.ts
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';

export function makeCacheKey(obj: unknown): string {
  const raw = JSON.stringify(obj ?? {});
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function getFromCache<T>(
  tenantId: string,
  cacheType: string,
  cacheKey: string
): Promise<{ hit: boolean; data?: T }> {
  const admin = createAdminClient();
  
  // Try app.ai_cache first
  let { data, error } = await admin
    .schema('app')
    .from('ai_cache')
    .select('response_data, expires_at')
    .eq('tenant_id', tenantId)
    .eq('cache_type', cacheType)
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  // Fallback to public.ai_cache if app schema fails
  if (error) {
    const { data: publicData, error: publicError } = await admin
      .from('ai_cache')
      .select('response_data, expires_at')
      .eq('tenant_id', tenantId)
      .eq('cache_type', cacheType)
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (publicError) {
      // Table doesn't exist - return cache miss
      return { hit: false };
    }
    data = publicData;
    error = publicError;
  }

  if (error) {
    // Log but don't throw - graceful degradation
    console.warn('Cache lookup error:', extractErrorMessage(error));
    return { hit: false };
  }
  if (!data) {
    return { hit: false };
  }
  return { hit: true, data: data.response_data as T };
}

export async function setCache<T>(
  tenantId: string,
  cacheType: string,
  cacheKey: string,
  data: T,
  ttlDays: number,
  model?: string
): Promise<void> {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
  
  // Try app.ai_cache first
  let { error } = await admin
    .schema('app')
    .from('ai_cache')
    .upsert(
      {
        tenant_id: tenantId,
        cache_type: cacheType,
        cache_key: cacheKey,
        response_data: data as any,
        model_used: model ?? null,
        ttl_days: ttlDays,
        expires_at: expiresAt,
      },
      { onConflict: 'tenant_id,cache_key,cache_type' }
    );

  // Fallback to public.ai_cache if app schema fails
  if (error) {
    const { error: publicError } = await admin.from('ai_cache').upsert(
      {
        tenant_id: tenantId,
        cache_type: cacheType,
        cache_key: cacheKey,
        response_data: data as any,
        model_used: model ?? null,
        ttl_days: ttlDays,
        expires_at: expiresAt,
      },
      { onConflict: 'tenant_id,cache_key,cache_type' }
    );

    if (publicError) {
      // Table doesn't exist - log but don't throw (graceful degradation)
      console.warn('ai_cache table not found, skipping cache write:', extractErrorMessage(publicError));
      return;
    }
  }
}

