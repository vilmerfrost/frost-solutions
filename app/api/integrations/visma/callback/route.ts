// app/api/integrations/visma/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/integrations/visma/oauth';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { BASE_PATH } from '@/utils/url';

export async function GET(req: NextRequest) {
 try {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) return NextResponse.json({ error: 'Saknar code/state.' }, { status: 400 });

  const [integrationId] = state.split(':');
  await exchangeCodeForToken(integrationId, code);

  const admin = createAdminClient();
  await admin.from('integrations').update({ status: 'connected', last_error: null }).eq('id', integrationId);

  // redirect till UI (include basePath since req.nextUrl.origin doesn't)
  const baseUrl = `${req.nextUrl.origin}${BASE_PATH}`;
  return NextResponse.redirect(new URL(`/settings/integrations?connected=visma`, baseUrl));
 } catch (e: any) {
  const baseUrl = `${req.nextUrl.origin}${BASE_PATH}`;
  return NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent(e.message || 'Okänt fel')}`, baseUrl));
 }
}

