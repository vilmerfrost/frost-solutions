// app/api/integrations/[id]/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/work-orders/helpers';
import { extractErrorMessage } from '@/lib/errorUtils';

/**
 * GET /api/integrations/[id]/jobs
 * Lista alla sync jobs för en integration
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
  const { id: integrationId } = await params;
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Tenant ID saknas' }, { status: 401 });
  }

  const admin = createAdminClient();
  
  // Verifiera att integrationen tillhör rätt tenant
  const { data: integration } = await admin
   .from('integrations')
   .select('id')
   .eq('id', integrationId)
   .eq('tenant_id', tenantId)
   .single();

  if (!integration) {
   return NextResponse.json({ error: 'Integration hittades inte' }, { status: 404 });
  }

  const { data, error } = await admin
   .from('integration_jobs')
   .select('*')
   .eq('integration_id', integrationId)
   .eq('tenant_id', tenantId)
   .order('created_at', { ascending: false })
   .limit(100);

  if (error) {
   return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json(data || []);
 } catch (e: any) {
  return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 });
 }
}

