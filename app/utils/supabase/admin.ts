import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

/**
 * Creates a timeout-aware fetch function with AbortController
 * @param timeoutMs - Timeout in milliseconds (default: 8000)
 */
function makeTimeoutFetch(timeoutMs: number) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const ctrl = new AbortController()
    const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
      return await fetch(input, {
        ...(init || {}),
        signal: ctrl.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Creates a Supabase admin client using the service role key
 * This bypasses Row Level Security (RLS) policies
 * 
 * Features:
 * - Hard timeout on all requests (default: 8 seconds)
 * - No auth refresh (server-side only)
 * - Schema support (app or public)
 * - Optimized for Next.js server routes
 * 
 * @param timeoutMs - Request timeout in milliseconds (default: 8000)
 * @param schema - Database schema to use ('public' or 'app', default: 'public')
 * @returns Supabase client configured with service role
 * @throws Error if service role key or URL is missing
 */
export function createAdminClient(timeoutMs = 8000, schema: 'public' | 'app' = 'public') {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL. ' +
      'Please check your .env.local file.'
    )
  }

  return createClient(supabaseUrl, serviceKey, {
    db: { schema }, // 👈 Schema support for app/public
    global: {
      fetch: makeTimeoutFetch(timeoutMs),
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

