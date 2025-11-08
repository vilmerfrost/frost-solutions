// app/lib/guards/fetchRestGuard.ts
/**
 * Global fetch guard för att fånga alla direkta Supabase REST-anrop från klienten
 * Detta ger oss stack trace för att hitta exakt vilken komponent som gör anropet
 */
export function installFetchGuard() {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = String(typeof input === 'string' ? input : (input as Request)?.url || input);

    // Fånga alla Supabase REST-anrop
    if (url.includes('.supabase.co/rest/v1/')) {
      // Skapa ett fel med stack trace
      const error = new Error(
        `[REST-GUARD] 🚨 Blocked client-side Supabase REST call detected!\n` +
        `URL: ${url}\n` +
        `This call should go through an API route instead.\n` +
        `Check the stack trace below to find the exact component/hook.`
      );

      // Logga stack trace för debugging
      console.error('🚨 [REST-GUARD] Blocked REST call:', {
        url,
        method: init?.method || 'GET',
        stack: error.stack,
      });

      // I dev: kasta fel för att stoppa execution och visa stack trace
      // I production: låt anropet passera (men logga ändå)
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    }

    return originalFetch(input, init);
  };

  console.log('🛡️ [REST-GUARD] Global fetch guard installed');
}

