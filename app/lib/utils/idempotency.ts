// app/lib/utils/idempotency.ts
import { createAdminClient } from '@/utils/supabase/admin';
import { createLogger } from './logger';

const logger = createLogger('Idempotency');

/**
 * Check if request has already been processed (idempotency)
 */
export async function checkIdempotency(
 tenantId: string,
 route: string,
 key: string
): Promise<unknown | null> {
 if (!key) return null;

 const admin = createAdminClient();

 const { data } = await admin
  .schema('app')
  .from('idempotency_keys')
  .select('response')
  .eq('tenant_id', tenantId)
  .eq('route', route)
  .eq('key', key)
  .maybeSingle();

 return data?.response ?? null;
}

/**
 * Store idempotency result
 */
export async function storeIdempotency(
 tenantId: string,
 route: string,
 key: string,
 response: unknown
): Promise<void> {
 const admin = createAdminClient();

 await admin.schema('app').from('idempotency_keys').upsert({
  tenant_id: tenantId,
  route,
  key,
  response,
  created_at: new Date().toISOString(),
 });
}

/**
 * Wrap function with idempotency check
 */
export async function withIdempotency<T>(
 tenantId: string,
 route: string,
 idempotencyKey: string | undefined,
 fn: () => Promise<T>
): Promise<T> {
 if (!idempotencyKey) {
  return fn();
 }

 // Check if already processed
 const cached = await checkIdempotency(tenantId, route, idempotencyKey);
 if (cached) {
  logger.info('Idempotency hit', { tenantId, route, key: idempotencyKey.slice(0, 16) });
  return cached as T;
 }

 // Execute function
 const result = await fn();

 // Store result
 await storeIdempotency(tenantId, route, idempotencyKey, result);

 return result;
}

