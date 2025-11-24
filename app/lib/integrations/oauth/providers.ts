// app/lib/integrations/oauth/providers.ts

import type { AccountingProvider, ProviderConfig } from '@/types/integrations';

/**
 * Get base URL for redirect URIs
 * Uses NEXT_PUBLIC_APP_URL from environment
 * CRITICAL: Must match exactly what's registered in OAuth provider portal
 * 
 * Note: For OAuth integrations (Fortnox/Visma), the redirect URI must be pre-registered
 * in their developer portals. If using ngrok, you'll need to register the ngrok URL there too.
 */
function getBaseUrl(overrideBaseUrl?: string): string {
  // Allow override for dynamic base URLs (e.g., from request headers)
  if (overrideBaseUrl) {
    return overrideBaseUrl.replace(/\/$/, '');
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required. Set it in .env.local');
  }
  
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, '');
}

/**
 * Build redirect URI for a provider
 * CRITICAL: Must match exactly what's registered in OAuth provider portal
 * 
 * @param provider - 'fortnox' or 'visma'
 * @param overrideBaseUrl - Optional base URL override (e.g., from request headers for ngrok support)
 * @returns Full redirect URI (e.g., http://localhost:3000/api/integrations/callback/fortnox)
 */
export function buildRedirectUri(provider: AccountingProvider, overrideBaseUrl?: string): string {
  const baseUrl = getBaseUrl(overrideBaseUrl);
  
  // NO trailing slash
  const redirectUri = `${baseUrl}/api/integrations/callback/${provider}`;
  
  console.log(`[OAuth] Building redirect URI for ${provider}:`, redirectUri);
  
  return redirectUri;
}

const FORTNOX_CONFIG: ProviderConfig = {
  authUrl: 'https://apps.fortnox.se/oauth-v1/auth',
  tokenUrl: 'https://apps.fortnox.se/oauth-v1/token',
  apiBaseUrl: 'https://api.fortnox.se/3',
  clientId: process.env.FORTNOX_CLIENT_ID!,
  clientSecret: process.env.FORTNOX_CLIENT_SECRET!,
  redirectUri: buildRedirectUri('fortnox'),
  scope: 'customer invoice article', // Space-separated, NOT comma-separated
  rateLimit: {
    requestsPerMinute: 300,
    retryAfter: 60,
  },
};

const VISMA_CONFIG: ProviderConfig = {
  authUrl: 'https://identity.vismaonline.com/connect/authorize',
  tokenUrl: 'https://identity.vismaonline.com/connect/token',
  apiBaseUrl: 'https://eaccountingapi.vismaonline.com/v2',
  clientId: process.env.VISMA_CLIENT_ID!,
  clientSecret: process.env.VISMA_CLIENT_SECRET!,
  redirectUri: buildRedirectUri('visma'),
  scope: 'ea:api ea:sales', // Space-separated
  rateLimit: {
    requestsPerMinute: 100,
    retryAfter: 60,
  },
};

/**
 * Get provider configuration
 * 
 * @param provider - 'fortnox' or 'visma'
 * @param overrideBaseUrl - Optional base URL override (e.g., from request headers for ngrok support)
 * @returns Provider configuration with redirect URI
 */
export function getProviderConfig(provider: AccountingProvider, overrideBaseUrl?: string): ProviderConfig {
  console.log(`[OAuth] Getting config for provider: ${provider}`);
  
  // Build config with potentially overridden redirect URI
  const baseConfig = provider === 'fortnox' ? FORTNOX_CONFIG : VISMA_CONFIG;
  
  // If override is provided, rebuild redirect URI
  if (overrideBaseUrl) {
    return {
      ...baseConfig,
      redirectUri: buildRedirectUri(provider, overrideBaseUrl),
    };
  }
  
  return baseConfig;
}

export function validateProviderConfig(provider: AccountingProvider): void {
  console.log(`[OAuth] Validating config for: ${provider}`);
  
  const config = getProviderConfig(provider);
  
  const errors: string[] = [];
  
  if (!config.clientId) {
    errors.push(`Missing ${provider.toUpperCase()}_CLIENT_ID`);
  }
  
  if (!config.clientSecret) {
    errors.push(`Missing ${provider.toUpperCase()}_CLIENT_SECRET`);
  }
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('Missing NEXT_PUBLIC_APP_URL');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
  
  console.log(`[OAuth] ✅ ${provider} configuration valid`);
  console.log(`[OAuth] Redirect URI: ${config.redirectUri}`);
}

