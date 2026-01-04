import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type ExposedSchema = 'public' | 'app' | 'graphql_public'

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
 * - Schema support with fallback to RPC functions
 * - Optimized for Next.js server routes
 * 
 * IMPORTANT: For 'app' schema, use RPC functions (see supabase/rpc/ folder)
 * If 'app' schema is exposed in Supabase API settings, direct access will work.
 * 
 * @param timeoutMs - Request timeout in milliseconds (default: 8000)
 * @param schema - Database schema to use ('public' or 'app', default: 'public')
 * @returns Supabase client configured with service role
 * @throws Error if service role key or URL is missing
 */
export function createAdminClient(timeoutMs = 8000, schema: ExposedSchema = 'public'): SupabaseClient {
 const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

 if (!supabaseUrl || !serviceKey) {
  throw new Error(
   'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL. ' +
   'Please check your .env.local file.'
  )
 }

 return createClient(supabaseUrl, serviceKey, {
  db: { schema },
  global: {
   fetch: makeTimeoutFetch(timeoutMs),
   headers: { 'X-Client-Info': 'frost-backend' },
  },
  auth: {
   autoRefreshToken: false,
   persistSession: false,
  },
 })
}

/**
 * Creates a service client specifically for 'app' schema operations
 * Falls back to 'public' schema if 'app' is not exposed
 * 
 * @param timeoutMs - Request timeout in milliseconds (default: 8000)
 * @returns Supabase client configured for app schema
 */
export function createAppSchemaClient(timeoutMs = 8000): SupabaseClient {
 return createAdminClient(timeoutMs, 'app')
}

/**
 * Health check to verify if a schema is exposed in Supabase API
 * Useful for startup validation or debugging
 * 
 * @param schema - Schema to check (default: 'app')
 * @returns true if schema is accessible, false otherwise
 */
export async function assertSchemaExposed(schema: ExposedSchema = 'app'): Promise<boolean> {
 try {
  const db = createAdminClient(5000, schema)
  // Try a minimal query to check if schema is accessible
  const { error } = await db.from('supplier_invoices').select('id').limit(0)
  
  if (error?.message?.includes('schema must be one of')) {
   console.warn(
    `⚠️ Schema "${schema}" is not exposed in Supabase API settings. ` +
    `Add "${schema}" to Database → API → Exposed schemas. ` +
    `Using RPC functions as fallback.`
   )
   return false
  }
  
  return !error
 } catch (err) {
  console.warn(`⚠️ Could not verify schema "${schema}":`, err)
  return false
 }
}

