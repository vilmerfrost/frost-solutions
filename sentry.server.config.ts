import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  
  // Kan vara bra att ha på servern för att se vad som ledde fram till kraschen
  debug: false, 
});