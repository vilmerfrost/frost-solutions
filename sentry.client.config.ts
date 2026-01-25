import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Justera denna. 1.0 = 100% av sessioner (dyrt). 0.1 = 10% (bra för prod).
  tracesSampleRate: 0.1, 
  
  // Ignorera "brus"-fel som inte påverkar användaren
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Network request failed",
    "Failed to fetch",
  ],
  
  // Visa feedback-dialog om appen kraschar totalt (valfritt)
  replaysOnErrorSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1, 
  
  integrations: [
    Sentry.replayIntegration(),
  ],
});