// app/api/integrations/fortnox/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/integrations/fortnox/oauth';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors from Fortnox
    if (error) {
      console.error('❌ Fortnox OAuth error:', { error, errorDescription, state });
      
      const baseUrl = req.nextUrl.origin;
      
      // Create user-friendly error messages based on error type
      let errorMessage = errorDescription || `OAuth-fel: ${error}`;
      
      if (error === 'error_missing_license') {
        errorMessage = 'Ditt Fortnox-konto saknar licens för de begärda behörigheterna. Kontrollera att ditt Fortnox-paket inkluderar fakturering (Fakturering, Bokföring eller högre).';
      } else if (error === 'invalid_scope') {
        errorMessage = 'Ogiltiga behörigheter. Kontrollera att OAuth-applikationen har rätt scopes konfigurerade i Fortnox Developer Portal.';
      } else if (error === 'access_denied') {
        errorMessage = 'Åtkomst nekad. Du avbröt auktoriseringen eller nekade behörigheterna.';
      }
      
      // Extract integrationId from state if available
      let integrationId: string | null = null;
      if (state) {
        const [id] = state.split(':');
        integrationId = id;
        
        // Update integration status to error using RPC function
        try {
          const admin = createAdminClient();
          // Try to use RPC function first, fallback to direct update
          const { error: rpcError } = await admin.rpc('update_integration_status', {
            p_integration_id: integrationId,
            p_status: 'error',
            p_last_error: errorMessage
          });
          
          if (rpcError) {
            // Fallback to direct update if RPC fails
            await admin.from('integrations').update({ 
              status: 'error', 
              last_error: errorMessage 
            }).eq('id', integrationId);
          }
        } catch (updateError) {
          console.error('Failed to update integration status:', updateError);
        }
      }
      
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent(errorMessage)}`, baseUrl)
      );
    }

    // Handle missing code/state
    if (!code || !state) {
      console.error('❌ Missing code or state in callback');
      const baseUrl = req.nextUrl.origin;
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('Saknar code eller state i OAuth callback.')}`, baseUrl)
      );
    }

    // Extract integrationId from state
    const [integrationId] = state.split(':');
    if (!integrationId) {
      console.error('❌ Invalid state format:', state);
      const baseUrl = req.nextUrl.origin;
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent('Ogiltigt state-format.')}`, baseUrl)
      );
    }

    // Exchange code for token
    await exchangeCodeForToken(integrationId, code);

    // Update integration status
    const admin = createAdminClient();
    await admin.from('integrations').update({ 
      status: 'connected', 
      last_error: null 
    }).eq('id', integrationId);

    // Redirect to UI with success
    const baseUrl = req.nextUrl.origin;
    return NextResponse.redirect(new URL(`/settings/integrations?connected=fortnox`, baseUrl));
  } catch (e: any) {
    console.error('💥 Exception in Fortnox callback:', e);
    const baseUrl = req.nextUrl.origin;
    const errorMessage = extractErrorMessage(e);
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${encodeURIComponent(errorMessage)}`, baseUrl)
    );
  }
}

