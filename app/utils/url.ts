/**
 * URL utility functions for handling base URLs across different environments.
 * 
 * This ensures redirects work correctly whether running on:
 * - localhost (development)
 * - ngrok tunnel (testing with external agents)
 * - production domain
 * 
 * Key principle: In the browser, always use window.location.origin as the source of truth.
 * On the server, fall back to environment variables.
 * 
 * Note: App runs under basePath '/app' (frostsolutions.se/app).
 * NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_APP_URL should include /app suffix.
 */

/** The basePath configured in next.config.mjs */
export const BASE_PATH = '/app';

/**
 * Get the base URL for the current request (includes basePath).
 * 
 * In the browser: Uses window.location.origin + basePath
 * On the server: Falls back to NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL
 * 
 * @returns The base URL including basePath (e.g., 'http://localhost:3000/app', 'https://frostsolutions.se/app')
 */
export function getBaseUrl(): string {
 // In the browser, use origin + basePath
 // This ensures ngrok URLs and any origin work correctly
 if (typeof window !== 'undefined') {
  return `${window.location.origin}${BASE_PATH}`;
 }

 // On the server, use environment variable as fallback
 // These should already include /app suffix
 const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
 
 if (siteUrl) {
  return siteUrl;
 }
 
 // PRODUCTION WARNING: Fallback to localhost should never happen in production
 if (process.env.NODE_ENV === 'production') {
  console.error('[URL] CRITICAL: NEXT_PUBLIC_SITE_URL is not set in production! Using localhost fallback.');
 }
 
 return `http://localhost:3000${BASE_PATH}`;
}

/**
 * Get base URL from request headers (for server-side usage).
 * Useful when you have access to Next.js request headers.
 * Includes basePath (/app) for proper URL construction.
 * 
 * @param headers - Next.js headers() object or Request headers
 * @returns The base URL including basePath extracted from headers or environment
 */
export function getBaseUrlFromHeaders(headers: Headers | { get: (name: string) => string | null }): string {
 // Try to get from headers first (works with ngrok, proxies, etc.)
 const forwardedHost = headers.get('x-forwarded-host');
 const host = forwardedHost || headers.get('host') || undefined;
 
 const forwardedProto = headers.get('x-forwarded-proto');
 const proto = forwardedProto || (process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https') ? 'https' : 'http');

 if (host) {
  // Include basePath since app runs under /app
  return `${proto}://${host}${BASE_PATH}`;
 }

 // Fall back to environment variable or default
 return getBaseUrl();
}

