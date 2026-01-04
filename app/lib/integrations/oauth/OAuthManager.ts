// app/lib/integrations/oauth/OAuthManager.ts

import { getProviderConfig } from './providers';
import { TokenVault } from './TokenVault';
import type { AccountingProvider, OAuthTokens } from '@/types/integrations';

/**
 * OAuthManager: Handle OAuth 2.0 flows for accounting integrations
 *
 * Supports:
 * - Authorization URL generation
 * - Token exchange
 * - Token refresh
 * - Token revocation
 */
export class OAuthManager {
 private vault: TokenVault;

 constructor() {
  this.vault = new TokenVault();
 }

 /**
  * Generate authorization URL for OAuth flow
  *
  * @param provider - 'fortnox' or 'visma'
  * @param tenantId - Tenant ID for state parameter
  * @param overrideBaseUrl - Optional base URL override (e.g., from request headers for ngrok support)
  * @returns Authorization URL
  */
 generateAuthorizationUrl(provider: AccountingProvider, tenantId: string, overrideBaseUrl?: string): string {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[OAuthManager] 🔐 GENERATING AUTH URL');
  console.log('[OAuthManager] Provider:', provider);
  console.log('[OAuthManager] Tenant:', tenantId);

  const config = getProviderConfig(provider, overrideBaseUrl);

  // Use redirect URI from config (may be overridden for ngrok support)
  const redirectUri = config.redirectUri;

  console.log('[OAuthManager] Redirect URI:', redirectUri);

  // State parameter: encode tenantId for callback validation
  const state = Buffer.from(
   JSON.stringify({
    tenantId,
    provider,
    redirectUri, // Store redirect URI in state for verification
    timestamp: Date.now(),
   })
  ).toString('base64url');

  const params = new URLSearchParams({
   client_id: config.clientId,
   redirect_uri: redirectUri, // ✅ Use static redirect URI from config
   response_type: 'code',
   scope: config.scope,
   state,
  });

  const authUrl = `${config.authUrl}?${params}`;

  console.log('[OAuthManager] ✅ Auth URL generated');
  console.log('[OAuthManager] State:', state);
  console.log('[OAuthManager] Full URL:', authUrl);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return authUrl;
 }

 /**
  * Exchange authorization code for tokens
  *
  * @param provider - 'fortnox' or 'visma'
  * @param code - Authorization code from callback
  * @param redirectUri - Redirect URI used in authorization request (must match exactly)
  * @returns OAuth tokens
  */
 async exchangeCodeForTokens(
  provider: AccountingProvider,
  code: string,
  redirectUri?: string
 ): Promise<OAuthTokens> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[OAuthManager] 🔄 EXCHANGING CODE FOR TOKENS');
  console.log('[OAuthManager] Provider:', provider);
  console.log('[OAuthManager] Code length:', code.length);

  const config = getProviderConfig(provider);

  // Use provided redirectUri or fallback to config (must match authorization redirect_uri EXACTLY)
  const finalRedirectUri = redirectUri || config.redirectUri;
  
  console.log('[OAuthManager] 📤 Request details:');
  console.log(' - Token URL:', config.tokenUrl);
  console.log(' - Grant type:', 'authorization_code');
  console.log(' - Redirect URI:', finalRedirectUri);
  console.log(' - Client ID:', config.clientId.slice(0, 8) + '...');

  try {
   const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: finalRedirectUri, // ✅ Must match authorization redirect_uri EXACTLY
    client_id: config.clientId,
    client_secret: config.clientSecret,
   });

   const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
   });

   const responseText = await response.text();

   console.log('[OAuthManager] 📥 Response status:', response.status);

   if (!response.ok) {
    console.error('[OAuthManager] ❌ Token exchange failed:', {
     status: response.status,
     statusText: response.statusText,
     body: responseText,
    });
    
    // Parse error if JSON
    let errorDetail = responseText;
    try {
     const errorJson = JSON.parse(responseText);
     errorDetail = errorJson.error_description || errorJson.error || responseText;
    } catch (e) {
     // Not JSON, use raw text
    }
    
    throw new Error(`Token exchange failed (${response.status}): ${errorDetail}`);
   }

   const tokens: OAuthTokens = JSON.parse(responseText);

   console.log('[OAuthManager] ✅ Tokens received:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiresIn: tokens.expires_in,
    tokenType: tokens.token_type,
    scope: tokens.scope,
   });

   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

   return tokens;
  } catch (error: any) {
   console.error('[OAuthManager] ❌ Exception during token exchange:', error);
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   throw error;
  }
 }

 /**
  * Refresh access token using refresh token
  *
  * @param provider - 'fortnox' or 'visma'
  * @param refreshTokenOrId - Refresh token string or Vault secret ID
  * @returns New OAuth tokens
  */
 async refreshAccessToken(
  provider: AccountingProvider,
  refreshTokenOrId: string
 ): Promise<OAuthTokens> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[OAuthManager] 🔄 REFRESHING ACCESS TOKEN');
  console.log('[OAuthManager] Provider:', provider);
  console.log('[OAuthManager] Refresh Token/ID length:', refreshTokenOrId.length);

  const config = getProviderConfig(provider);

  try {
   // If it looks like a token (long string), use it directly
   // Otherwise, try to retrieve from Vault
   let refreshToken: string;
   if (refreshTokenOrId.length > 50) {
    // Likely a token string
    refreshToken = refreshTokenOrId;
   } else {
    // Likely a Vault ID
    refreshToken = await this.vault.getRefreshToken(refreshTokenOrId);
   }

   const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
   });

   console.log('[OAuthManager] 📤 Requesting new tokens');

   const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
   });

   const responseText = await response.text();

   console.log('[OAuthManager] 📥 Response status:', response.status);

   if (!response.ok) {
    console.error('[OAuthManager] ❌ Token refresh failed:', {
     status: response.status,
     body: responseText,
    });
    throw new Error(`Token refresh failed: ${response.status} ${responseText}`);
   }

   const tokens: OAuthTokens = JSON.parse(responseText);

   console.log('[OAuthManager] ✅ Tokens refreshed:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiresIn: tokens.expires_in,
   });

   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

   return tokens;
  } catch (error: any) {
   console.error('[OAuthManager] ❌ Exception during token refresh:', error);
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   throw error;
  }
 }

 /**
  * Store tokens securely in Vault
  *
  * @param tenantId - Tenant ID
  * @param provider - Provider name
  * @param tokens - OAuth tokens to store
  * @returns Vault secret IDs
  */
 async storeTokens(
  tenantId: string,
  provider: AccountingProvider,
  tokens: OAuthTokens
 ): Promise<{ accessTokenId: string; refreshTokenId: string }> {
  console.log('[OAuthManager] 💾 Storing tokens in Vault');

  try {
   const accessTokenId = await this.vault.storeAccessToken(
    tenantId,
    provider,
    tokens.access_token
   );

   const refreshTokenId = await this.vault.storeRefreshToken(
    tenantId,
    provider,
    tokens.refresh_token
   );

   console.log('[OAuthManager] ✅ Tokens stored successfully');

   return { accessTokenId, refreshTokenId };
  } catch (error: any) {
   console.error('[OAuthManager] ❌ Failed to store tokens:', error);
   throw error;
  }
 }
}

