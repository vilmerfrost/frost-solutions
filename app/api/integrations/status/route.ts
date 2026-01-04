// app/api/integrations/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
 console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
 console.log('[Integration Status API] 📊 FETCHING STATUS');

 try {
  const tenantId = await getTenantId();

  if (!tenantId) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Integration Status API] Tenant:', tenantId);

  const adminClient = createAdminClient();

  // Get all integrations for tenant
  const { data: integrations, error: integrationsError } = await adminClient
   .from('accounting_integrations')
   .select('*')
   .eq('tenant_id', tenantId);

  if (integrationsError) {
   throw integrationsError;
  }

  console.log('[Integration Status API] Integrations found:', integrations?.length);

  // Get recent sync logs
  const { data: recentLogs, error: logsError } = await adminClient
   .from('sync_logs')
   .select('*')
   .eq('tenant_id', tenantId)
   .order('created_at', { ascending: false })
   .limit(50);

  if (logsError) {
   throw logsError;
  }

  console.log('[Integration Status API] Recent logs:', recentLogs?.length);

  // Calculate statistics
  const stats = {
   total: recentLogs?.length || 0,
   success: recentLogs?.filter((log) => log.status === 'success').length || 0,
   error: recentLogs?.filter((log) => log.status === 'error').length || 0,
   pending: recentLogs?.filter((log) => log.status === 'pending').length || 0,
  };

  console.log('[Integration Status API] Stats:', stats);
  console.log('[Integration Status API] ✅ SUCCESS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return NextResponse.json({
   success: true,
   integrations,
   recentLogs,
   stats,
  });
 } catch (error: any) {
  console.error('[Integration Status API] ❌ ERROR:', error);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return NextResponse.json(
   { success: false, error: error.message },
   { status: 500 }
  );
 }
}

