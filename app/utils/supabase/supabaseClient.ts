// /app/utils/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase-generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use createBrowserClient from @supabase/ssr to properly handle OAuth redirects
// Typed with generated Database type for better type safety
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

if (process.env.NODE_ENV !== 'production') {
 const blockedTables = new Set(['time_entries'])
 const originalFrom = supabase.from.bind(supabase)
 ;(supabase as unknown as { from: typeof supabase.from }).from = ((table: string) => {
  if (blockedTables.has(table)) {
   const message = `[Supabase Guard] Client-side access to "${table}" is not allowed. Use a server API route instead.`
   console.error(message)
   throw new Error(message)
  }
  return originalFrom(table as never)
 }) as typeof supabase.from
}

if (typeof window !== 'undefined') {
 const stopRefresh = () => {
  try {
   supabase.auth.stopAutoRefresh()
  } catch (error) {
   console.warn('Supabase: failed to stop auto refresh', error)
  }
 }

 const startRefresh = () => {
  try {
   supabase.auth.startAutoRefresh()
  } catch (error) {
   console.warn('Supabase: failed to start auto refresh', error)
  }
 }

 window.addEventListener('offline', stopRefresh)
 window.addEventListener('online', startRefresh)
}

export default supabase
