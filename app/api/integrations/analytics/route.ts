// app/api/integrations/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
 console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
 console.log('[Integration Analytics API] 📊 FETCHING ANALYTICS');

 try {
  const tenantId = await getTenantId();

  if (!tenantId) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  console.log('[Integration Analytics API] Tenant:', tenantId);
  console.log('[Integration Analytics API] Days:', days);

  const adminClient = createAdminClient();

  // Get sync logs for the period
  const { data: logs, error: logsError } = await adminClient
   .from('sync_logs')
   .select('*')
   .eq('tenant_id', tenantId)
   .gte('created_at', startDate.toISOString())
   .order('created_at', { ascending: true });

  if (logsError) {
   throw logsError;
  }

  console.log('[Integration Analytics API] Logs found:', logs?.length);

  // Calculate daily statistics
  const dailyStats: Record<string, { success: number; error: number; total: number; avgDuration: number }> = {};
  
  logs?.forEach((log) => {
   const date = new Date(log.created_at).toISOString().split('T')[0];
   if (!dailyStats[date]) {
    dailyStats[date] = { success: 0, error: 0, total: 0, avgDuration: 0 };
   }
   dailyStats[date].total++;
   if (log.status === 'success') {
    dailyStats[date].success++;
   } else if (log.status === 'error') {
    dailyStats[date].error++;
   }
   if (log.duration_ms) {
    const currentAvg = dailyStats[date].avgDuration;
    const count = dailyStats[date].total;
    dailyStats[date].avgDuration = (currentAvg * (count - 1) + log.duration_ms) / count;
   }
  });

  // Convert to array format for charts
  const timeline = Object.entries(dailyStats)
   .map(([date, stats]) => ({
    date,
    success: stats.success,
    error: stats.error,
    total: stats.total,
    avgDuration: Math.round(stats.avgDuration),
    successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
   }))
   .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate operation type statistics
  const operationStats: Record<string, { success: number; error: number; total: number }> = {};
  logs?.forEach((log) => {
   if (!operationStats[log.operation]) {
    operationStats[log.operation] = { success: 0, error: 0, total: 0 };
   }
   operationStats[log.operation].total++;
   if (log.status === 'success') {
    operationStats[log.operation].success++;
   } else if (log.status === 'error') {
    operationStats[log.operation].error++;
   }
  });

  const operationBreakdown = Object.entries(operationStats).map(([operation, stats]) => ({
   operation,
   success: stats.success,
   error: stats.error,
   total: stats.total,
   successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
  }));

  // Calculate provider statistics
  const { data: integrations } = await adminClient
   .from('accounting_integrations')
   .select('id, provider')
   .eq('tenant_id', tenantId);

  const providerStats: Record<string, { success: number; error: number; total: number }> = {};
  logs?.forEach((log) => {
   const integration = integrations?.find((i) => i.id === log.integration_id);
   const provider = integration?.provider || 'unknown';
   if (!providerStats[provider]) {
    providerStats[provider] = { success: 0, error: 0, total: 0 };
   }
   providerStats[provider].total++;
   if (log.status === 'success') {
    providerStats[provider].success++;
   } else if (log.status === 'error') {
    providerStats[provider].error++;
   }
  });

  const providerBreakdown = Object.entries(providerStats).map(([provider, stats]) => ({
   provider,
   success: stats.success,
   error: stats.error,
   total: stats.total,
   successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
  }));

  // Calculate resource type statistics
  const resourceStats: Record<string, { success: number; error: number; total: number }> = {};
  logs?.forEach((log) => {
   if (!resourceStats[log.resource_type]) {
    resourceStats[log.resource_type] = { success: 0, error: 0, total: 0 };
   }
   resourceStats[log.resource_type].total++;
   if (log.status === 'success') {
    resourceStats[log.resource_type].success++;
   } else if (log.status === 'error') {
    resourceStats[log.resource_type].error++;
   }
  });

  const resourceBreakdown = Object.entries(resourceStats).map(([resourceType, stats]) => ({
   resourceType,
   success: stats.success,
   error: stats.error,
   total: stats.total,
   successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
  }));

  // Calculate overall metrics
  const totalLogs = logs?.length || 0;
  const successCount = logs?.filter((l) => l.status === 'success').length || 0;
  const errorCount = logs?.filter((l) => l.status === 'error').length || 0;
  const avgDuration = logs?.length
   ? Math.round(
     (logs?.reduce((sum, l) => sum + (l.duration_ms || 0), 0) || 0) / logs.length
    )
   : 0;

  console.log('[Integration Analytics API] ✅ SUCCESS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return NextResponse.json({
   success: true,
   timeline,
   operationBreakdown,
   providerBreakdown,
   resourceBreakdown,
   overall: {
    total: totalLogs,
    success: successCount,
    error: errorCount,
    successRate: totalLogs > 0 ? (successCount / totalLogs) * 100 : 0,
    avgDuration,
   },
  });
 } catch (error: any) {
  console.error('[Integration Analytics API] ❌ ERROR:', error);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return NextResponse.json(
   { success: false, error: error.message },
   { status: 500 }
  );
 }
}

