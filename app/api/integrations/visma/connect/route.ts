// app/api/integrations/visma/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/work-orders/helpers';
import { getAuthorizationUrl } from '@/lib/integrations/visma/oauth';
import { createClient } from '@/utils/supabase/server';
import { encryptJSON } from '@/lib/encryption';

export async function POST(req: NextRequest) {
 try {
  const { provider } = await req.json(); // 'visma_eaccounting' or 'visma_payroll'
  if (!provider || !['visma_eaccounting', 'visma_payroll'].includes(provider)) {
   return NextResponse.json({ error: 'Ogiltig provider. Använd visma_eaccounting eller visma_payroll.' }, { status: 400 });
  }

  const tenantId = await getTenantId();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Inte inloggad.' }, { status: 401 });

  const admin = createAdminClient();
  const encClientSecret = encryptJSON({ v: process.env.VISMA_CLIENT_SECRET! });
  
  // Använd RPC function för att skriva till app.integrations
  // (Supabase PostgREST kan inte skriva till app schema direkt)
  const { data: integrationId, error } = await admin.rpc('create_integration', {
   p_tenant_id: tenantId,
   p_provider: provider,
   p_status: 'disconnected',
   p_client_id: process.env.VISMA_CLIENT_ID!,
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
  return NextResponse.json({ url });
 } catch (e: any) {
  return NextResponse.json({ error: e.message || 'Okänt fel' }, { status: 500 });
 }
}

function extractErrorMessage(error: any): string {
 if (typeof error === 'string') return error;
 if (error?.message) return error.message;
 if (error?.error) return String(error.error);
 return 'Okänt fel';
}

