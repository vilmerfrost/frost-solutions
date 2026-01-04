// app/lib/idempotency.ts

/**
 * Idempotency Key Management
 * Based on GPT-5 implementation
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { IdempotencyError } from './ocr/errors';

/**
 * Check if idempotency key exists and return cached response
 */
export async function checkIdempotency(
 tenantId: string,
 route: string,
 key?: string | null
): Promise<unknown | null> {
 if (!key) return null;

 try {
  const admin = createAdminClient();
  const schema = 'app';

  const { data, error } = await admin
   .schema(schema)
   .from('idempotency_keys')
   .select('response')
   .eq('tenant_id', tenantId)
   .eq('route', route)
   .eq('key', key)
   .maybeSingle();

  if (error) {
   console.error('[Idempotency] Database error:', error);
   return null;
  }

  return data?.response ?? null;
 } catch (error) {
  console.error('[Idempotency] Error checking idempotency:', error);
  return null;
 }
}

/**
 * Store idempotency key with response
 */
export async function storeIdempotency(
 tenantId: string,
 route: string,
 key: string,
 response: unknown
): Promise<void> {
 try {
  const admin = createAdminClient();
  const schema = 'app';

  await admin
   .schema(schema)
   .from('idempotency_keys')
   .insert({
    tenant_id: tenantId,
    route,
    key,
    response: response as any,
   });
 } catch (error: any) {
  // If it's a unique constraint violation, that's okay (key already exists)
  if (error?.code === '23505') {
   return;
  }
  console.error('[Idempotency] Error storing idempotency:', error);
 }
}

