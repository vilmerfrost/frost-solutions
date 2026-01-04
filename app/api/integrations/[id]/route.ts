// app/api/integrations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/work-orders/helpers';
import { extractErrorMessage } from '@/lib/errorUtils';

// Force Node.js runtime for better Supabase compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/integrations/[id]
 * Koppla bort en integration (sätt status till 'disconnected' och ta bort tokens)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
  const { id: integrationId } = await params;
  
  // Validate integrationId
  if (!integrationId || integrationId === 'undefined') {
   console.error('❌ Missing or invalid integration ID:', integrationId);
   return NextResponse.json({ error: 'Integration ID saknas eller är ogiltigt' }, { status: 400 });
  }

  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Tenant ID saknas' }, { status: 401 });
  }

  const admin = createAdminClient(8000);
  
  // Verifiera att integrationen tillhör rätt tenant
  const { data: integration, error: checkError } = await admin
   .from('integrations')
   .select('id, tenant_id, provider')
   .eq('id', integrationId)
   .eq('tenant_id', tenantId)
   .maybeSingle();

  if (checkError) {
   console.error('❌ Error checking integration:', checkError);
   // Om tabellen inte finns, returnera 404
   if (checkError.code === '42P01' || checkError.message?.toLowerCase().includes('does not exist')) {
    return NextResponse.json({ error: 'Integration tabellen finns inte' }, { status: 404 });
   }
   return NextResponse.json({ error: extractErrorMessage(checkError) }, { status: 500 });
  }

  if (!integration) {
   return NextResponse.json({ error: 'Integration hittades inte' }, { status: 404 });
  }

  // Använd RPC-funktion för att disconnecta (skriver direkt till app.integrations)
  const { error: disconnectError } = await admin.rpc('disconnect_integration', {
   p_integration_id: integrationId,
   p_tenant_id: tenantId
  });

  if (disconnectError) {
   console.error('❌ Error disconnecting integration:', disconnectError);
   return NextResponse.json({ error: extractErrorMessage(disconnectError) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
 } catch (e: any) {
  console.error('💥 Exception in disconnect route:', e);
  return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 });
 }
}

