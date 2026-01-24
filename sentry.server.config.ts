// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://fd7fdfe8693e57ae1074b697ff5d6751@o4510767507046400.ingest.de.sentry.io/4510767541715024",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Remove cookies from request headers
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.Cookie;
      delete event.request.headers.authorization;
      delete event.request.headers.Authorization;
    }

    // Remove cookies from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          // Remove sensitive data from breadcrumb data
          const { cookie, Cookie, authorization, Authorization, ...safeData } = breadcrumb.data as Record<string, any>;
          return { ...breadcrumb, data: safeData };
        }
        return breadcrumb;
      });
    }

    // Remove sensitive data from contexts
    if (event.contexts?.request?.headers) {
      const { cookie, Cookie, authorization, Authorization, ...safeHeaders } = event.contexts.request.headers as Record<string, any>;
      event.contexts.request.headers = safeHeaders;
    }

    return event;
  },
});
