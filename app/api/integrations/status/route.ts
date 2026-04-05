import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    let integrations: any[] = [];
    let recentLogs: any[] = [];

    try {
      const { data, error } = await adminClient
        .from('integrations')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[Integration Status] Table integrations not found');
        } else {
          console.warn('[Integration Status] Error:', error.message);
        }
      } else {
        integrations = data || [];
      }
    } catch (err) {
      console.warn('[Integration Status] Failed to fetch:', err);
    }

    try {
      const { data, error } = await adminClient
        .from('sync_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error && error.code !== '42P01') {
        console.warn('[Integration Status] Logs error:', error.message);
      } else {
        recentLogs = data || [];
      }
    } catch (err) {
      console.warn('[Integration Status] Failed to fetch logs:', err);
    }

    const stats = {
      total: recentLogs.length,
      success: recentLogs.filter((log) => log.status === 'success').length,
      error: recentLogs.filter((log) => log.status === 'error').length,
      pending: recentLogs.filter((log) => log.status === 'pending').length,
    };

    return NextResponse.json({
      success: true,
      integrations,
      recentLogs,
      stats,
    });
  } catch (error: any) {
    console.error('[Integration Status] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
