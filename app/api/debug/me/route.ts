import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
 try {
  let access: string | undefined;
  
  try {
   const c = await cookies();
   access = c.get('sb-access-token')?.value;
  } catch (err) {
   // cookies() may fail in edge runtime - return empty response
   console.warn('debug/me: cookies() failed', err);
   return NextResponse.json({
    hasCookie: false,
    userId: null,
    tenant_id: null,
    app_metadata: null,
    error: 'Cookies not available',
   });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
   return NextResponse.json(
    { error: 'Missing Supabase configuration' },
    { status: 500 }
   );
  }

  const ssr = createClient(
   supabaseUrl,
   supabaseKey,
   {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: access ? { Authorization: `Bearer ${access}` } : {} },
   }
  );

  const { data, error } = await ssr.auth.getUser();

  const tenantId = data?.user?.app_metadata?.tenant_id ?? null

  return NextResponse.json({
   hasCookie: Boolean(access),
   userId: data?.user?.id ?? null,
   tenant_id: tenantId, // Exposed directly for useTenant() hook
   app_metadata: data?.user?.app_metadata ?? null,
   error: error?.message ?? null,
  });
 } catch (err: any) {
  console.error('debug/me error:', err);
  return NextResponse.json(
   { 
    error: err?.message || 'Internal server error',
    hasCookie: false,
    userId: null,
    tenant_id: null,
    app_metadata: null,
   },
   { status: 500 }
  );
 }
}
