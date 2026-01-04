// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function createServerSupabase() {
 const cookieStore = await cookies(); // <- await här
 const access = cookieStore.get('sb-access-token')?.value;
 const refresh = cookieStore.get('sb-refresh-token')?.value;

 return createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
   auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
   },
   global: {
    headers: access ? { Authorization: `Bearer ${access}` } : {},
   },
  }
 );
}
