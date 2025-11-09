import { NextRequest, NextResponse } from 'next/server';
import { resolveTimeEntryContext, getTimeEntryColumnSet, TimeEntryContextError } from '../_utils';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const context = await resolveTimeEntryContext();

    if (!context.isAdmin) {
      return NextResponse.json({ error: 'Endast administratörer kan godkänna tidsrapporter' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[APPROVE-ALL] 🚀 STARTING APPROVAL PROCESS');
    console.log('[APPROVE-ALL] Context:', {
      tenantId: context.tenantId,
      userId: context.userId,
      employeeId: context.employeeId,
      startDate,
      endDate,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // CRITICAL FIX: Use RPC function to avoid replica lag
    // RPC runs on PRIMARY database and ensures read-after-write consistency
    if (!context.employeeId) {
      console.error('[APPROVE-ALL] ❌ No employeeId found');
      return NextResponse.json({ 
        error: 'Employee ID saknas. Kan inte godkänna tidsrapporter.',
        success: false 
      }, { status: 400 });
    }

    console.log('[APPROVE-ALL] 📊 Calling RPC function...');
    
    const { data: updatedData, error: rpcError } = await context.adminSupabase.rpc(
      'approve_time_entries_all',
      {
        p_tenant_id: context.tenantId,
        p_employee_id: context.employeeId,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      }
    );

    if (rpcError) {
      console.error('[APPROVE-ALL] ❌ RPC error:', rpcError);
      
      // Fallback to direct UPDATE if RPC doesn't exist yet
      console.log('[APPROVE-ALL] ⚠️ Falling back to direct UPDATE...');
      return await fallbackDirectUpdate(context, startDate, endDate);
    }

    const updatedCount = Array.isArray(updatedData) ? updatedData.length : 0;

    console.log('[APPROVE-ALL] ✅ RPC completed:', {
      updatedCount,
      sampleData: updatedData?.slice(0, 3).map((e: any) => ({
        id: e.id,
        approval_status: e.approval_status,
        approved_at: e.approved_at,
      })),
    });

    // CRITICAL: Verify update by re-fetching a sample entry
    if (updatedCount > 0 && updatedData && updatedData.length > 0) {
      const sampleId = updatedData[0].id;
      const { data: verifyEntry, error: verifyError } = await context.adminSupabase
        .from('time_entries')
        .select('id, approval_status, approved_at, approved_by')
        .eq('id', sampleId)
        .single();
      
      console.log('[APPROVE-ALL] ✅ VERIFICATION (re-fetch):', {
        sampleId,
        verifyEntry,
        verifyError: verifyError?.message,
        isApproved: verifyEntry?.approval_status === 'approved',
      });
    }

    const duration = Date.now() - startTime;
    console.log('[APPROVE-ALL] ⏱️ Total duration:', duration, 'ms');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      count: updatedCount,
      data: updatedData || [],
      message: updatedCount > 0 
        ? `${updatedCount} tidsrapporter godkända` 
        : 'Inga tidsrapporter behövde godkännas',
      _debug: {
        updatedCount,
        duration,
        method: 'RPC',
      },
    });
  } catch (err: any) {
    if (err instanceof TimeEntryContextError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[APPROVE-ALL] ❌ FATAL ERROR:', err);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: err.message 
    }, { status: 500 });
  }
}

// Fallback function if RPC doesn't exist
async function fallbackDirectUpdate(
  context: Awaited<ReturnType<typeof resolveTimeEntryContext>>,
  startDate: string | null,
  endDate: string | null
) {
  console.log('[APPROVE-ALL] Using fallback direct UPDATE method');
  
  const updates: Record<string, any> = {
    approval_status: 'approved',
    approved_at: new Date().toISOString(),
  };
  
  if (context.employeeId) {
    updates.approved_by = context.employeeId;
  }

  // Count before update
  let countQuery = context.adminSupabase
    .from('time_entries')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', context.tenantId)
    .neq('approval_status', 'approved');

  if (startDate) {
    countQuery = countQuery.gte('date', startDate);
  }
  if (endDate) {
    countQuery = countQuery.lte('date', endDate);
  }

  const { count: beforeCount } = await countQuery;
  console.log('[APPROVE-ALL] Entries to approve (fallback):', beforeCount);

  if (!beforeCount || beforeCount === 0) {
    return NextResponse.json({
      success: true,
      updated: 0,
      count: 0,
      message: 'Inga tidsrapporter behövde godkännas',
    });
  }

  // Update query
  let updateQuery = context.adminSupabase
    .from('time_entries')
    .update(updates)
    .eq('tenant_id', context.tenantId)
    .neq('approval_status', 'approved');

  if (startDate) {
    updateQuery = updateQuery.gte('date', startDate);
  }
  if (endDate) {
    updateQuery = updateQuery.lte('date', endDate);
  }

  const { data, error } = await updateQuery.select('id, approval_status, approved_at, approved_by');

  if (error) {
    console.error('[APPROVE-ALL] ❌ Fallback update error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to approve time entries' 
    }, { status: 500 });
  }

  const updatedCount = data?.length ?? 0;
  console.log('[APPROVE-ALL] ✅ Fallback update completed:', updatedCount);

  return NextResponse.json({
    success: true,
    updated: updatedCount,
    count: updatedCount,
    data: data || [],
    message: `${updatedCount} tidsrapporter godkända`,
    _debug: {
      updatedCount,
      method: 'fallback',
    },
  });
}
