// app/api/projects/route.ts
// app/api/projects/route.ts (anon+RLS-variant, prefererad)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getTenantId } from '@/lib/serverTenant';

async function ssrClient() {
 const c = await cookies();
 const access = c.get('sb-access-token')?.value;
 return createClient(process.env.SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  global: { headers: access ? { Authorization: `Bearer ${access}` } : {} },
 });
}

export async function POST(req: Request) {
 const body = await req.json()
 const { name, tenant_id: bodyTenant, ...rest } = body || {}

 if (!name) {
  return NextResponse.json({ error: 'Missing name' }, { status: 400 });
 }

 const supa = await ssrClient();
 const { data: { user } = {}, error: userErr } = await supa.auth.getUser();
 if (userErr || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 // Security: Always validate against JWT claim (authoritative)
 const claimTenant = await getTenantId();
 if (!claimTenant) {
  return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
 }

 // If body provides tenant_id, it must match the JWT claim
 if (bodyTenant && bodyTenant !== claimTenant) {
  return NextResponse.json({ error: 'Tenant mismatch' }, { status: 403 });
 }

 const { data, error } = await supa
  .from('projects')
  .insert([{ name, tenant_id: claimTenant, created_by: user.id, ...rest }])
  .select('*')
  .single();

 if (error) {
  return NextResponse.json({ error: error.message }, { status: 400 });
 }

 return NextResponse.json({ project: data }, { status: 201 });
}

// Redirect GET requests to /api/projects/list
export async function GET(req: Request) {
 const tenantId = await getTenantId();
 if (!tenantId) {
  return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
 }
 
 // Redirect to list endpoint
 const url = new URL(req.url);
 url.pathname = '/api/projects/list';
 url.searchParams.set('tenantId', tenantId);
 
 return NextResponse.redirect(url);
}