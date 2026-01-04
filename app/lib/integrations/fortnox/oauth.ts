// app/lib/integrations/fortnox/oauth.ts
import { storeToken, getToken, isExpired } from '@/lib/integrations/token-storage';

const FORTNOX_AUTH_URL = 'https://apps.fortnox.se/oauth-v1/auth';   // auth screen
const FORTNOX_TOKEN_URL = 'https://apps.fortnox.se/oauth-v1/token';  // token exchange

/**
 * Get Fortnox OAuth authorization URL
 * 
 * Fortnox scopes format: space-separated list of scope names
 * Valid scopes: invoice, customer, salary, timereporting, offer, etc.
 * NOT: invoice:read invoice:write (that format is not supported)
 * 
 * NOTE: Start with minimal scopes (invoice) and add more as needed.
 * Some scopes may require special configuration in Fortnox Developer Portal.
 * 
 * IMPORTANT: "invoice" scope is available in all Fortnox packages.
 * "customer" scope may require Fortnox Fakturering or higher package.
 */
export function getAuthorizationUrl(integrationId: string, state: string, scope = 'invoice') {
 const params = new URLSearchParams({
  client_id: process.env.FORTNOX_CLIENT_ID!,
  redirect_uri: process.env.FORTNOX_REDIRECT_URI!,
  response_type: 'code',
  scope,
  state
 });
 return `${FORTNOX_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(integrationId: string, code: string) {
 const res = await fetch(FORTNOX_TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
   grant_type: 'authorization_code',
   code,
   client_id: process.env.FORTNOX_CLIENT_ID!,
   client_secret: process.env.FORTNOX_CLIENT_SECRET!,
   redirect_uri: process.env.FORTNOX_REDIRECT_URI!
  })
 });
 if (!res.ok) throw new Error(`Fortnox token exchange misslyckades: ${await res.text()}`);
 const tok = await res.json();
 const expiresAt = new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString();
 await storeToken(integrationId, {
  access_token: tok.access_token,
  refresh_token: tok.refresh_token,
  scope: tok.scope,
  expires_at: expiresAt
 });
}

export async function refreshToken(integrationId: string) {
 const tok = await getToken(integrationId);
 if (!tok?.refresh_token) throw new Error('Saknar refresh token för Fortnox.');
 const res = await fetch(FORTNOX_TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
   grant_type: 'refresh_token',
   refresh_token: tok.refresh_token!,
   client_id: process.env.FORTNOX_CLIENT_ID!,
   client_secret: process.env.FORTNOX_CLIENT_SECRET!
  })
 });
 if (!res.ok) throw new Error(`Fortnox refresh misslyckades: ${await res.text()}`);
 const nt = await res.json();
 const expiresAt = new Date(Date.now() + (nt.expires_in ?? 3600) * 1000).toISOString();
 await storeToken(integrationId, {
  access_token: nt.access_token,
  refresh_token: nt.refresh_token ?? tok.refresh_token,
  scope: nt.scope ?? tok.scope,
  expires_at: expiresAt
 });
}

export async function getValidToken(integrationId: string) {
 const tok = await getToken(integrationId);
 if (!tok) throw new Error('Ingen Fortnox-token lagrad.');
 if (isExpired(tok.expires_at)) {
  await refreshToken(integrationId);
  return (await getToken(integrationId))!;
 }
 return tok;
}

