// app/utils/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
 const cookieStorePromise = cookies() // <- Promise i Next 16

 return createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  }
 )
}
