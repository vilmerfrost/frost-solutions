// app/lib/http/fetcher.ts
/**
 * Strict fetch wrapper with JSON in/out
 * Throws on !ok with clear error messages (Swedish for UI)
 */
export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { parse?: 'json' | 'text' }
): Promise<T> {
  const res = await fetch(input, {
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

