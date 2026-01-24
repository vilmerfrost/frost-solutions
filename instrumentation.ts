import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }

  // Client-side initialization is handled automatically by Next.js Sentry SDK
  // when sentry.client.config.ts exists - no manual import needed
}

export const onRequestError = Sentry.captureRequestError;
