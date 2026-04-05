import { NextRequest } from 'next/server';
import { resolveAuthAdmin, apiSuccess, handleRouteError } from '@/lib/api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin();
    if (auth.error) return auth.error;

    const { tenantId, admin } = auth;
    const { id: integrationId } = await params;

    // Verify integration belongs to this tenant
    const { data: integration } = await admin.from('integrations')
      .select('id, status')
      .eq('id', integrationId)
      .eq('tenant_id', tenantId)
      .single();

    if (!integration) {
      return handleRouteError(Object.assign(new Error('Integration not found'), { status: 404 }));
    }

    // Last sync from sync_logs
    const { data: lastLog } = await admin.from('sync_logs')
      .select('created_at, status, error_message')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Pending and failed job counts
    const { count: pendingJobs } = await admin.from('integration_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('integration_id', integrationId)
      .eq('status', 'pending');

    const { count: failedJobs } = await admin.from('integration_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('integration_id', integrationId)
      .eq('status', 'failed');

    // Recent errors (last 5)
    const { data: recentErrors } = await admin.from('sync_logs')
      .select('created_at, status, error_message, entity_type, entity_id')
      .eq('integration_id', integrationId)
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(5);

    return apiSuccess({
      integrationId,
      integrationStatus: integration.status,
      lastSync: lastLog?.created_at ?? null,
      lastSyncStatus: lastLog?.status ?? null,
      lastSyncError: lastLog?.error_message ?? null,
      pendingJobs: pendingJobs ?? 0,
      failedJobs: failedJobs ?? 0,
      recentErrors: recentErrors ?? [],
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
