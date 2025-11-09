// app/lib/integrations/oauth/providers.ts

import type { AccountingProvider, ProviderConfig } from '@/types/integrations';

const FORTNOX_CONFIG: ProviderConfig = {
  authUrl: 'https://apps.fortnox.se/oauth-v1/auth',
  tokenUrl: 'https://apps.fortnox.se/oauth-v1/token',
  apiBaseUrl: 'https://api.fortnox.se/3',
  clientId: process.env.FORTNOX_CLIENT_ID!,
  clientSecret: process.env.FORTNOX_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/fortnox`,
  scope: 'customer invoice article', // Add more scopes as needed
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
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/visma`,
  scope: 'ea:api ea:sales', // Add more scopes as needed
  rateLimit: {
    requestsPerMinute: 100,
    retryAfter: 60,
  },
};

export function getProviderConfig(provider: AccountingProvider): ProviderConfig {
  switch (provider) {
    case 'fortnox':
      return FORTNOX_CONFIG;
    case 'visma':
      return VISMA_CONFIG;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function validateProviderConfig(provider: AccountingProvider): void {
  const config = getProviderConfig(provider);

  if (!config.clientId) {
    throw new Error(`Missing ${provider.toUpperCase()}_CLIENT_ID environment variable`);
  }

  if (!config.clientSecret) {
    throw new Error(`Missing ${provider.toUpperCase()}_CLIENT_SECRET environment variable`);
  }

  console.log(`[Provider Config] ✅ ${provider} configuration valid`);
}

