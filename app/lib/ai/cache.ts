// app/lib/ai/cache.ts
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';

export function makeCacheKey(tenantId: string, messages: unknown): string {
 const hash = crypto.createHash('sha256').update(JSON.stringify(messages)).digest('hex');
 return `${tenantId}:${hash}`;
}

export async function getCached(tenantId: string, key: string): Promise<unknown | null> {
 const admin = createAdminClient();
 
 const { data } = await admin
  .schema('app')
  .from('ai_response_cache')
  .select('response, expires_at')
  .eq('tenant_id', tenantId)
  .eq('cache_key', key)
  .gt('expires_at', new Date().toISOString())
  .maybeSingle();
 
 return data?.response ?? null;
}

export async function setCached(
 tenantId: string,
 key: string,
 response: unknown,
 ttlSec = 3600
): Promise<void> {
 const admin = createAdminClient();
 const exp = new Date(Date.now() + ttlSec * 1000).toISOString();
 
 await admin
  .schema('app')
  .from('ai_response_cache')
  .upsert(
   { tenant_id: tenantId, cache_key: key, response, expires_at: exp },
   { onConflict: 'tenant_id,cache_key' }
  );
}
