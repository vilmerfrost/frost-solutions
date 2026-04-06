// app/utils/supabase/server.ts
import { cookies, headers } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
 const cookieStorePromise = cookies() // <- Promise i Next 16
  const headerStorePromise = headers()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

 return createServerClient(
  supabaseUrl!,
  supabaseAnonKey!,
  {
   cookies: {
    async get(name: string) {
     try {
      const store = await cookieStorePromise
      return store.get(name)?.value
     } catch (err) {
      // cookies() may fail in edge runtime or middleware
      return undefined
     }
    },
    async set(name: string, value: string, options: CookieOptions) {
     try {
      const store = await cookieStorePromise
      store.set({ name, value, ...options })
     } catch (err) {
      // Silently fail - cookies can't be set in some contexts
     }
    },
    async remove(name: string, options: CookieOptions) {
     try {
      const store = await cookieStorePromise
      store.set({ name, value: '', ...options })
     } catch (err) {
      // Silently fail
     }
    },
   },
     global: {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
       const headerStore = await headerStorePromise
       const requestAuthHeader = headerStore.get('authorization')
       const mergedHeaders = new Headers(init?.headers ?? {})

       if (requestAuthHeader && !mergedHeaders.has('Authorization')) {
        mergedHeaders.set('Authorization', requestAuthHeader)
       }

       return fetch(input, {
        ...init,
        headers: mergedHeaders,
       })
      },
     },
  }
 )
}
