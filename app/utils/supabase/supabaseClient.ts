// /app/utils/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase-generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>

let browserClient: BrowserSupabaseClient | null = null
let browserClientInitialized = false

function getSupabaseClient(): BrowserSupabaseClient {
 if (browserClient) {
  return browserClient
 }

 if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("@supabase/ssr: Your project's URL and API key are required to create a Supabase client!")
 }

 browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

 if (!browserClientInitialized) {
  browserClientInitialized = true

  if (process.env.NODE_ENV !== 'production') {
   const blockedTables = new Set(['time_entries'])
   const originalFrom = browserClient.from.bind(browserClient)
   ;(browserClient as unknown as { from: typeof browserClient.from }).from = ((table: string) => {
    if (blockedTables.has(table)) {
     const message = `[Supabase Guard] Client-side access to "${table}" is not allowed. Use a server API route instead.`
     console.error(message)
     throw new Error(message)
    }
    return originalFrom(table as never)
   }) as typeof browserClient.from
  }

  if (typeof window !== 'undefined') {
   const stopRefresh = () => {
    try {
     browserClient?.auth.stopAutoRefresh()
    } catch (error) {
     console.warn('Supabase: failed to stop auto refresh', error)
    }
   }

   const startRefresh = () => {
    try {
     browserClient?.auth.startAutoRefresh()
    } catch (error) {
     console.warn('Supabase: failed to start auto refresh', error)
    }
   }

   window.addEventListener('offline', stopRefresh)
   window.addEventListener('online', startRefresh)
  }
 }

 return browserClient
}

export const supabase = new Proxy({} as BrowserSupabaseClient, {
 get(_target, prop, receiver) {
  const client = getSupabaseClient()
  const value = Reflect.get(client as object, prop, receiver)
  return typeof value === 'function' ? value.bind(client) : value
 },
})

export default supabase
