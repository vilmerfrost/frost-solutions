// app/lib/ai/ratelimit.ts
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';

export async function enforceRateLimit(
  tenantId: string,
  bucketKey: 'invoice' | 'project-plan',
  maxPerMinute: number
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 60000) * 60000).toISOString();

  // Try RPC first (if exists)
  const { data: rpcData, error: rpcError } = await admin.rpc('increment_ai_rate_limit', {
    p_tenant_id: tenantId,
    p_bucket_key: bucketKey,
    p_window_start: windowStart,
  });

  // If RPC exists and works, use it
  if (!rpcError && typeof rpcData === 'number') {
    if (rpcData > maxPerMinute) {
      throw new Error(`Rate limit uppnådd för ${bucketKey}. Försök igen om en minut.`);
    }
    return;
  }

  // Fallback: manual upsert (try app.ai_rate_limits first, then public.ai_rate_limits)
  let existing: any = null;
  let upErr: any = null;

  // Try app.ai_rate_limits first
  const { data: appData, error: appError } = await admin
    .schema('app')
    .from('ai_rate_limits')
    .select('count')
    .eq('tenant_id', tenantId)
    .eq('bucket_key', bucketKey)
    .eq('window_start', windowStart)
    .maybeSingle();

  if (!appError && appData !== null) {
    existing = appData;
    const count = (existing?.count ?? 0) + 1;

    const { error: upsertErr } = await admin
      .schema('app')
      .from('ai_rate_limits')
      .upsert({
        tenant_id: tenantId,
        bucket_key: bucketKey,
        window_start: windowStart,
        count: count,
      });

    upErr = upsertErr;

    if (!upErr && count > maxPerMinute) {
      throw new Error(`Rate limit uppnådd för ${bucketKey}. Försök igen om en minut.`);
    }
  } else {
    // Try public.ai_rate_limits as fallback
    const { data: publicData, error: publicError } = await admin
      .from('ai_rate_limits')
      .select('count')
      .eq('tenant_id', tenantId)
      .eq('bucket_key', bucketKey)
      .eq('window_start', windowStart)
      .maybeSingle();

    if (publicError) {
      // Table doesn't exist - skip rate limiting (graceful degradation)
      console.warn('ai_rate_limits table not found, skipping rate limit check');
      return;
    }

    existing = publicData;
    const count = (existing?.count ?? 0) + 1;

    const { error: upsertErr } = await admin.from('ai_rate_limits').upsert({
      tenant_id: tenantId,
      bucket_key: bucketKey,
      window_start: windowStart,
      count: count,
    });

    upErr = upsertErr;

    if (!upErr && count > maxPerMinute) {
      throw new Error(`Rate limit uppnådd för ${bucketKey}. Försök igen om en minut.`);
    }
  }

  if (upErr) {
    // If upsert fails, log but don't block (graceful degradation)
    console.warn('Rate limit upsert failed:', extractErrorMessage(upErr));
    return;
  }
}

