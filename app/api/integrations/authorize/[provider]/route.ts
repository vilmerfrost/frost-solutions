// app/api/integrations/authorize/[provider]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { OAuthManager } from '@/lib/integrations/oauth/OAuthManager';
import { validateProviderConfig } from '@/lib/integrations/oauth/providers';
import type { AccountingProvider } from '@/types/integrations';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> | { provider: string } }
) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[Authorize] 🚀 STARTING OAUTH FLOW');

  try {
    // Get tenant ID
    const tenantId = await getTenantId();

    if (!tenantId) {
      console.error('[Authorize] ❌ No tenant ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Authorize] Tenant:', tenantId);

    // Get provider from params
    const params = await Promise.resolve(context.params);
    const provider = params.provider as AccountingProvider;

    console.log('[Authorize] Provider:', provider);

    // Validate provider
    if (!['fortnox', 'visma'].includes(provider)) {
      console.error('[Authorize] ❌ Invalid provider:', provider);
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Validate provider configuration
    try {
      validateProviderConfig(provider);
    } catch (configError: any) {
      console.error('[Authorize] ❌ Provider config error:', configError);
      return NextResponse.json(
        { error: `Configuration error: ${configError.message}` },
        { status: 500 }
      );
    }

    // Generate authorization URL
    const oauthManager = new OAuthManager();
    const authUrl = oauthManager.generateAuthorizationUrl(provider, tenantId);

    console.log('[Authorize] ✅ Redirecting to:', authUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Redirect to provider's authorization page
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('[Authorize] ❌ FATAL ERROR:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

