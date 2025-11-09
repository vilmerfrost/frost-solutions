// app/api/debug/oauth-config/route.ts

import { NextResponse } from 'next/server';
import { getProviderConfig, buildRedirectUri } from '@/lib/integrations/oauth/providers';

/**
 * Debug endpoint to verify OAuth configuration
 * Access: http://localhost:3000/api/debug/oauth-config
 */
export async function GET() {
  try {
    const fortnoxConfig = getProviderConfig('fortnox');
    const vismaConfig = getProviderConfig('visma');

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL,
      fortnox: {
        authUrl: fortnoxConfig.authUrl,
        tokenUrl: fortnoxConfig.tokenUrl,
        redirectUri: fortnoxConfig.redirectUri,
        clientIdPresent: !!fortnoxConfig.clientId,
        clientSecretPresent: !!fortnoxConfig.clientSecret,
        scope: fortnoxConfig.scope,
        // Decoded redirect URI for easy comparison
        redirectUriDecoded: decodeURIComponent(fortnoxConfig.redirectUri),
      },
      visma: {
        authUrl: vismaConfig.authUrl,
        tokenUrl: vismaConfig.tokenUrl,
        redirectUri: vismaConfig.redirectUri,
        clientIdPresent: !!vismaConfig.clientId,
        clientSecretPresent: !!vismaConfig.clientSecret,
        scope: vismaConfig.scope,
        // Decoded redirect URI for easy comparison
        redirectUriDecoded: decodeURIComponent(vismaConfig.redirectUri),
      },
      instructions: {
        step1: 'Copy the redirectUri values above',
        step2: 'Register them EXACTLY in Fortnox/Visma developer portals',
        step3: 'Ensure no trailing slashes, correct protocol (http for localhost, https for production)',
        step4: 'Restart dev server after updating NEXT_PUBLIC_APP_URL',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message,
        hint: 'Make sure NEXT_PUBLIC_APP_URL is set in .env.local',
      },
      { status: 500 }
    );
  }
}

