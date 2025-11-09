// app/lib/integrations/tokenManager.ts

import { createAdminClient } from '@/utils/supabase/admin';
import { OAuthManager } from './oauth/OAuthManager';
import type { AccountingProvider } from '@/types/integrations';

/**
 * TokenManager: Wrapper for token management
 * Uses OAuthManager for refresh logic
 */
export class TokenManager {
  private oauthManager: OAuthManager;
  private adminClient;

  constructor(private tenantId: string) {
    this.oauthManager = new OAuthManager();
    this.adminClient = createAdminClient();
  }

  async getValidAccessToken(provider: AccountingProvider): Promise<string> {
    // Get integration record
    const { data: integration, error } = await this.adminClient
      .from('accounting_integrations')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('provider', provider)
      .eq('status', 'active')
      .single();

    if (error || !integration) {
      throw new Error(`No active integration found for ${provider}`);
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    if (integration.expires_at) {
      const expiresAt = new Date(integration.expires_at);
      const now = new Date();
      const expiresIn = expiresAt.getTime() - now.getTime();

      if (expiresIn < 5 * 60 * 1000) {
        // Refresh token
        console.log(`[TokenManager] Refreshing ${provider} token for tenant ${this.tenantId}`);
        return await this.refreshToken(provider);
      }
    }

    // Get token from metadata (temporary solution - in production use Vault)
    // Tokens are stored in metadata.access_token and metadata.refresh_token
    // In production, these should be encrypted or stored in Supabase Vault
    const accessToken = (integration.metadata as any)?.access_token;

    if (!accessToken) {
      throw new Error(`No access token found for ${provider}`);
    }

    return accessToken;
  }

  async refreshToken(provider: AccountingProvider): Promise<string> {
    const { data: integration, error } = await this.adminClient
      .from('accounting_integrations')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('provider', provider)
      .single();

    if (error || !integration) {
      throw new Error(`No integration found for ${provider}`);
    }

    // Get refresh token from metadata (temporary solution)
    const refreshToken = (integration.metadata as any)?.refresh_token;

    if (!refreshToken) {
      throw new Error(`No refresh token found for ${provider}`);
    }

    // Refresh using OAuthManager (we'll need to update OAuthManager to accept refresh token directly)
    // For now, use a workaround: store refresh token temporarily
    const tokens = await this.oauthManager.refreshAccessToken(
      provider,
      refreshToken // Pass token directly instead of ID
    );

    // Store new tokens in metadata (temporary - in production use Vault)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    await this.adminClient
      .from('accounting_integrations')
      .update({
        expires_at: expiresAt,
        metadata: {
          ...(integration.metadata || {}),
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_refreshed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return tokens.access_token;
  }
}

