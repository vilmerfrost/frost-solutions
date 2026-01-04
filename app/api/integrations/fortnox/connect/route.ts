// app/api/integrations/fortnox/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/work-orders/helpers';
import { getAuthorizationUrl } from '@/lib/integrations/fortnox/oauth';
import { createClient } from '@/utils/supabase/server';
import { encryptJSON } from '@/lib/encryption';

export async function POST(req: NextRequest) {
 try {
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Tenant ID saknas' }, { status: 401 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Inte inloggad.' }, { status: 401 });

  // Verifiera att environment-variablerna finns
  const clientId = process.env.FORTNOX_CLIENT_ID;
  const clientSecret = process.env.FORTNOX_CLIENT_SECRET;
  
  if (!clientId || clientId.includes('ditt_fortnox') || clientId === 'ditt_fortnox_client_id_här') {
   console.error('❌ FORTNOX_CLIENT_ID är inte satt korrekt i .env.local');
   return NextResponse.json({ 
    error: 'Fortnox Client ID saknas. Kontrollera att FORTNOX_CLIENT_ID är satt i .env.local och starta om servern.' 
   }, { status: 500 });
  }
  
  if (!clientSecret || clientSecret.includes('ditt_fortnox') || clientSecret === 'ditt_fortnox_client_secret_här') {
   console.error('❌ FORTNOX_CLIENT_SECRET är inte satt korrekt i .env.local');
   return NextResponse.json({ 
    error: 'Fortnox Client Secret saknas. Kontrollera att FORTNOX_CLIENT_SECRET är satt i .env.local och starta om servern.' 
   }, { status: 500 });
  }

  const admin = createAdminClient();
  const encClientSecret = encryptJSON({ v: clientSecret });
  
  // Använd RPC function för att skriva till app.integrations
  // (Supabase PostgREST kan inte skriva till app schema direkt)
  const { data: integrationId, error } = await admin.rpc('create_integration', {
   p_tenant_id: tenantId,
   p_provider: 'fortnox',
   p_status: 'disconnected',
   p_client_id: clientId,
   p_client_secret_encrypted: encClientSecret,
   p_created_by: user.id
  });
  
  if (error) {
   console.error('Error creating integration:', error);
   return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });
  }

  if (!integrationId) {
   return NextResponse.json({ error: 'Kunde inte skapa integration' }, { status: 500 });
  }

  const state = `${integrationId}:${tenantId}`;
  const url = getAuthorizationUrl(integrationId, state);
  
  // Verifiera att URL:en är korrekt
  if (url.includes('ditt_fortnox') || url.includes('client_id_här')) {
   console.error('❌ URL innehåller placeholder. Client ID:', clientId);
   return NextResponse.json({ 
    error: 'Fortnox Client ID är inte korrekt konfigurerad. Kontrollera .env.local och starta om servern.' 
   }, { status: 500 });
  }
  
  return NextResponse.json({ url });
 } catch (e: any) {
  console.error('Exception in fortnox connect:', e);
  return NextResponse.json({ error: e.message || 'Okänt fel' }, { status: 500 });
 }
}

function extractErrorMessage(error: any): string {
 if (typeof error === 'string') return error;
 if (error?.message) return error.message;
 if (error?.error) return String(error.error);
 return 'Okänt fel';
}

