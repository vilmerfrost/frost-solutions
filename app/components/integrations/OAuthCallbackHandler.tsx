// app/components/integrations/OAuthCallbackHandler.tsx
"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
 'access_denied': 'Anslutningen avbröts av användaren.',
 'invalid_scope': 'De begärda behörigheterna (scopes) är felaktiga.',
 'error_missing_license': 'Ditt konto saknar licens för de begärda behörigheterna. Kontrollera att ditt paket inkluderar fakturering.',
 'redirect_uri_mismatch': 'Redirect URI matchar inte. Kontrollera att den är korrekt registrerad i developer portal.',
 'token_exchange_failed': 'Kunde inte byta kod mot token. Försök igen.',
 'token_storage_failed': 'Kunde inte spara tokens. Kontakta support.',
 'database_error': 'Databasfel. Kontakta support.',
 'invalid_state': 'Ogiltig state parameter. Försök igen.',
 'invalid_request': 'Ogiltig begäran. Kontrollera din konfiguration.',
};

const PROVIDER_NAMES: Record<string, string> = {
 'fortnox': 'Fortnox',
 'visma': 'Visma eAccounting',
};

export function OAuthCallbackHandler() {
 const searchParams = useSearchParams();
 const queryClient = useQueryClient();

 useEffect(() => {
  const success = searchParams.get('success');
  const provider = searchParams.get('provider');
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const message = searchParams.get('message');

  let toastShown = false;

  // Handle success case
  if (success === 'true' && provider) {
   const providerName = PROVIDER_NAMES[provider] || provider;
   toast.success(`${providerName} har anslutits!`);
   
   // Invalidate queries to refresh integration status
   queryClient.invalidateQueries({ queryKey: ['integrations'] });
   
   toastShown = true;
  } 
  // Handle error cases
  else if (errorCode) {
   const errorMessage = OAUTH_ERROR_MESSAGES[errorCode] || 'Ett okänt OAuth-fel inträffade.';
   toast.error('Anslutning misslyckades', { description: errorMessage });
   toastShown = true;
  } else if (error) {
   const errorMessage = OAUTH_ERROR_MESSAGES[error] || message || 'Ett okänt fel inträffade.';
   toast.error('Anslutning misslyckades', { description: errorMessage });
   toastShown = true;
  }

  if (toastShown) {
   // Rensa URL:en efter att vi visat meddelandet
   window.history.replaceState(null, '', '/settings/integrations');
  }
 }, [searchParams, queryClient]);

 return null; // Denna komponent renderar inget UI
}

