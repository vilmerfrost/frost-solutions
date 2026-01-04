import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
 const { user_id, tenant_id } = await req.json();
 if (!user_id || !tenant_id) {
  return NextResponse.json({ error: 'Missing user_id or tenant_id' }, { status: 400 });
 }

 const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
 );

 const { data, error } = await admin.auth.admin.updateUserById(user_id, {
  app_metadata: { tenant_id },
 });

 if (error) return NextResponse.json({ error: error.message }, { status: 400 });
 return NextResponse.json({ ok: true, user: data.user });
}
