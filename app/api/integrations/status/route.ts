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

  // Get all integrations for tenant (gracefully handle missing table)
  let integrations: any[] = [];
  let recentLogs: any[] = [];
  
  try {
   const { data, error: integrationsError } = await adminClient
    .from('accounting_integrations')
    .select('*')
    .eq('tenant_id', tenantId);

   if (integrationsError) {
    // If table doesn't exist, return empty array
    if (integrationsError.code === '42P01' || integrationsError.message?.includes('does not exist')) {
     console.warn('[Integration Status API] Table accounting_integrations not found, returning empty');
    } else {
     console.warn('[Integration Status API] Error fetching integrations:', integrationsError.message);
    }
   } else {
    integrations = data || [];
   }
  } catch (err) {
   console.warn('[Integration Status API] Failed to fetch integrations:', err);
  }

  console.log('[Integration Status API] Integrations found:', integrations?.length);

  // Get recent sync logs (gracefully handle missing table)
  try {
   const { data, error: logsError } = await adminClient
    .from('sync_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

   if (logsError) {
    if (logsError.code === '42P01' || logsError.message?.includes('does not exist')) {
     console.warn('[Integration Status API] Table sync_logs not found, returning empty');
    } else {
     console.warn('[Integration Status API] Error fetching logs:', logsError.message);
    }
   } else {
    recentLogs = data || [];
   }
  } catch (err) {
   console.warn('[Integration Status API] Failed to fetch logs:', err);
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

