// app/lib/integrations/token-storage.ts
import { createAdminClient } from '@/utils/supabase/admin';
import { encryptJSON, decryptJSON } from '@/lib/encryption';
import { extractErrorMessage } from '@/lib/errorUtils';

export type StoredToken = {
 access_token: string;
 refresh_token?: string;
 expires_at?: string; // ISO
 scope?: string;
};

export async function storeToken(integrationId: string, token: StoredToken) {
 const admin = createAdminClient();
 const encAccess = encryptJSON({ v: token.access_token });
 const encRefresh = token.refresh_token ? encryptJSON({ v: token.refresh_token }) : null;
 // Note: Supabase accesses tables via search_path (public, app)
 // If table is in app schema, Supabase should find it automatically
 const { error } = await admin.from('integrations').update({
  access_token_encrypted: encAccess,
  refresh_token_encrypted: encRefresh,
  scope: token.scope ?? null,
  expires_at: token.expires_at ?? null,
  status: 'connected',
  last_error: null
 }).eq('id', integrationId);
 if (error) throw new Error(extractErrorMessage(error));
}

export async function getToken(integrationId: string): Promise<StoredToken | null> {
 const admin = createAdminClient();
 const { data, error } = await admin.from('integrations')
  .select('access_token_encrypted, refresh_token_encrypted, expires_at, scope')
  .eq('id', integrationId).single();
 if (error) throw new Error(extractErrorMessage(error));
 if (!data?.access_token_encrypted) return null;
 const access = decryptJSON<{ v: string }>(data.access_token_encrypted).v;
 const refresh = data.refresh_token_encrypted ? decryptJSON<{ v: string }>(data.refresh_token_encrypted).v : undefined;
 return { access_token: access, refresh_token: refresh, expires_at: data.expires_at ?? undefined, scope: data.scope ?? undefined };
}

export function isExpired(expires_at?: string) {
 if (!expires_at) return false;
 return Date.now() > new Date(expires_at).getTime() - 60_000; // 60s skew
}

