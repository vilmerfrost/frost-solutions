// app/api/integrations/callback/[provider]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { OAuthManager } from '@/lib/integrations/oauth/OAuthManager';
import type { AccountingProvider } from '@/types/integrations';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> | { provider: string } }
) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[OAuth Callback] 🎯 RECEIVED CALLBACK');

  try {
    const params = await Promise.resolve(context.params);
    const provider = params.provider as AccountingProvider;

    console.log('[OAuth Callback] Provider:', provider);

    // Get base URL from request headers (fallback to env var)
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    
    console.log('[OAuth Callback] Base URL:', baseUrl);

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('[OAuth Callback] Query params:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
    });

    // Check for OAuth errors
    if (error) {
      console.error('[OAuth Callback] ❌ OAuth error:', {
        error,
        description: errorDescription,
      });
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${error}&message=${errorDescription}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[OAuth Callback] ❌ Missing required parameters');
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=invalid_request`
      );
    }

    // Decode and validate state parameter
    let stateData: { tenantId: string; provider: string; redirectUri?: string; timestamp: number };

    try {
      const stateJson = Buffer.from(state, 'base64url').toString('utf-8');
      stateData = JSON.parse(stateJson);

      console.log('[OAuth Callback] State decoded:', {
        tenantId: stateData.tenantId,
        provider: stateData.provider,
        age: Date.now() - stateData.timestamp,
      });

      // Validate state freshness (15 minutes)
      if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
        throw new Error('State expired');
      }

      // Validate provider matches
      if (stateData.provider !== provider) {
        throw new Error('Provider mismatch');
      }
    } catch (stateError: any) {
      console.error('[OAuth Callback] ❌ Invalid state:', stateError);
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=invalid_state`
      );
    }

    const tenantId = stateData.tenantId;
    const redirectUri = stateData.redirectUri || `${baseUrl}/api/integrations/callback/${provider}`;
    
    console.log('[OAuth Callback] ✅ State validated for tenant:', tenantId);
    console.log('[OAuth Callback] Using redirect URI:', redirectUri);

    // Exchange code for tokens
    const oauthManager = new OAuthManager();
    let tokens;

    try {
      tokens = await oauthManager.exchangeCodeForTokens(provider, code, redirectUri);
    } catch (tokenError: any) {
      console.error('[OAuth Callback] ❌ Token exchange failed:', tokenError);
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=token_exchange_failed`
      );
    }

    // Store tokens (get identifiers for Vault - in production use Vault)
    let tokenIds;

    try {
      tokenIds = await oauthManager.storeTokens(tenantId, provider, tokens);
    } catch (vaultError: any) {
      console.error('[OAuth Callback] ❌ Failed to store tokens:', vaultError);
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=token_storage_failed`
      );
    }

    console.log('[OAuth Callback] ✅ Tokens stored:', tokenIds);

    // Calculate expiry timestamp
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // Store integration in database
    const adminClient = createAdminClient();

    const { data: integration, error: dbError } = await adminClient
      .from('accounting_integrations')
      .upsert(
        {
          tenant_id: tenantId,
          provider,
          status: 'active',
          access_token_id: tokenIds.accessTokenId, // Identifier
          refresh_token_id: tokenIds.refreshTokenId, // Identifier
          expires_at: expiresAt,
          scope: tokens.scope,
          metadata: {
            connected_at: new Date().toISOString(),
            // Store tokens in metadata (temporary - should be encrypted in production)
            // In production, use Supabase Vault or encrypt with pgcrypto
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          },
        },
        {
          onConflict: 'tenant_id,provider',
        }
      )
      .select()
      .single();

    if (dbError) {
      console.error('[OAuth Callback] ❌ Database error:', dbError);
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=database_error`
      );
    }

    console.log('[OAuth Callback] ✅ Integration saved:', integration.id);
    console.log('[OAuth Callback] ✅ SUCCESS - Redirecting to success page');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Redirect to success page
    return NextResponse.redirect(
      `${baseUrl}/integrations?success=true&provider=${provider}`
    );
  } catch (error: any) {
    console.error('[OAuth Callback] ❌ FATAL ERROR:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=unknown&message=${encodeURIComponent(error.message)}`
    );
  }
}

