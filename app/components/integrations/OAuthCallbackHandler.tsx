// app/components/integrations/OAuthCallbackHandler.tsx
"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from '@/lib/toast';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  'access_denied': 'Anslutningen avbröts av användaren i Fortnox.',
  'invalid_scope': 'De begärda behörigheterna (scopes) är felaktiga.',
  'error_missing_license': 'Ditt Fortnox-konto saknar licens för de begärda behörigheterna. Kontrollera att ditt Fortnox-paket inkluderar fakturering (Fakturering, Bokföring eller högre).',
};

export function OAuthCallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');

    let toastShown = false;

    if (connected === 'fortnox') {
      toast.success('Fortnox har anslutits!');
      toastShown = true;
    } else if (connected === 'visma_eaccounting') {
      toast.success('Visma eAccounting har anslutits!');
      toastShown = true;
    } else if (connected === 'visma_payroll') {
      toast.success('Visma Payroll har anslutits!');
      toastShown = true;
    } else if (errorCode) {
      const message = OAUTH_ERROR_MESSAGES[errorCode] || 'Ett okänt OAuth-fel inträffade.';
      toast.error('Anslutning misslyckades', { description: message });
      toastShown = true;
    } else if (error) {
      toast.error('Anslutning misslyckades', { description: error });
      toastShown = true;
    }

    if (toastShown) {
      // Rensa URL:en efter att vi visat meddelandet
      window.history.replaceState(null, '', '/settings/integrations');
    }
  }, [searchParams]);

  return null; // Denna komponent renderar inget UI
}

