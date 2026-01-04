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
 */

/**
 * Get the base URL for the current request.
 * 
 * In the browser: Uses window.location.origin (works with localhost, ngrok, and production)
 * On the server: Falls back to NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL
 * 
 * @returns The base URL (e.g., 'http://localhost:3001', 'https://abc123.ngrok-free.dev', 'https://frostsolutions.se')
 */
export function getBaseUrl(): string {
 // In the browser, always use the current origin
 // This ensures ngrok URLs work correctly
 if (typeof window !== 'undefined') {
  return window.location.origin;
 }

 // On the server, use environment variable as fallback
 // Prefer NEXT_PUBLIC_SITE_URL, fall back to NEXT_PUBLIC_APP_URL, then localhost
 return (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3001'
 );
}

/**
 * Get base URL from request headers (for server-side usage).
 * Useful when you have access to Next.js request headers.
 * 
 * @param headers - Next.js headers() object or Request headers
 * @returns The base URL extracted from headers or environment
 */
export function getBaseUrlFromHeaders(headers: Headers | { get: (name: string) => string | null }): string {
 // Try to get from headers first (works with ngrok, proxies, etc.)
 const forwardedHost = headers.get('x-forwarded-host');
 const host = forwardedHost || headers.get('host') || undefined;
 
 const forwardedProto = headers.get('x-forwarded-proto');
 const proto = forwardedProto || (process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https') ? 'https' : 'http');

 if (host) {
  return `${proto}://${host}`;
 }

 // Fall back to environment variable or default
 return getBaseUrl();
}

