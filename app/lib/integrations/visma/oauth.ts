// app/lib/integrations/visma/oauth.ts
import { storeToken, getToken, isExpired } from '@/lib/integrations/token-storage';

const VISMA_AUTH_URL = 'https://identity.visma.com/connect/authorize';
const VISMA_TOKEN_URL = 'https://identity.visma.com/connect/token';

export function getAuthorizationUrl(integrationId: string, state: string, scope = 'ea:customer:read ea:customer:write ea:invoice:read ea:invoice:write offline_access') {
 const p = new URLSearchParams({
  client_id: process.env.VISMA_CLIENT_ID!,
  redirect_uri: process.env.VISMA_REDIRECT_URI!,
  response_type: 'code',
  scope,
  state
 });
 return `${VISMA_AUTH_URL}?${p.toString()}`;
}

export async function exchangeCodeForToken(integrationId: string, code: string) {
 const res = await fetch(VISMA_TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
   grant_type: 'authorization_code',
   code,
   client_id: process.env.VISMA_CLIENT_ID!,
   client_secret: process.env.VISMA_CLIENT_SECRET!,
   redirect_uri: process.env.VISMA_REDIRECT_URI!
  })
 });
 if (!res.ok) throw new Error(`Visma token exchange misslyckades: ${await res.text()}`);
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
 if (!tok?.refresh_token) throw new Error('Saknar refresh token för Visma.');
 const res = await fetch(VISMA_TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
   grant_type: 'refresh_token',
   refresh_token: tok.refresh_token!,
   client_id: process.env.VISMA_CLIENT_ID!,
   client_secret: process.env.VISMA_CLIENT_SECRET!
  })
 });
 if (!res.ok) throw new Error(`Visma refresh misslyckades: ${await res.text()}`);
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
 if (!tok) throw new Error('Ingen Visma-token lagrad.');
 if (isExpired(tok.expires_at)) {
  await refreshToken(integrationId);
  return (await getToken(integrationId))!;
 }
 return tok;
}

