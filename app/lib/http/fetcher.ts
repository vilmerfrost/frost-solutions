// app/lib/http/fetcher.ts
import { BASE_PATH } from '@/utils/url';

/**
 * Strict fetch wrapper with JSON in/out
 * Throws on !ok with clear error messages (Swedish for UI)
 * Automatically prepends BASE_PATH for /api routes
 */
export async function apiFetch<T>(
 input: RequestInfo | URL,
 init?: RequestInit & { parse?: 'json' | 'text' }
): Promise<T> {
 // Automatically prepend BASE_PATH for /api routes
 let url = input;
 if (typeof input === 'string' && input.startsWith('/api')) {
  url = `${BASE_PATH}${input}`;
 }
 
 const res = await fetch(url, {
  ...init,
  headers: {
   'Content-Type': 'application/json',
   ...(init?.headers || {}),
  },
 });

 const parser = init?.parse ?? 'json';
 const body =
  parser === 'json'
   ? await res.json().catch(() => ({}))
   : await res.text();

 if (!res.ok) {
  const msg =
   (typeof body === 'object' &&
    'error' in (body as any) &&
    (body as any).error) ||
   (typeof body === 'string' && body) ||
   res.statusText;
  throw new Error(
   typeof msg === 'string' ? msg : 'Något gick fel vid hämtning.'
  );
 }

 return body as T;
}

