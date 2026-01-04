import { NextRequest, NextResponse } from 'next/server';
import { resolveTimeEntryContext, getTimeEntryColumnSet, TimeEntryContextError } from '../../_utils';

export async function POST(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id } = await params;
  const context = await resolveTimeEntryContext();

  if (!context.isAdmin) {
   return NextResponse.json({ error: 'Endast administratörer kan godkänna tidsrapporter' }, { status: 403 });
  }

  console.log('[Approve Time Entry] Starting approval', {
   entryId: id,
   tenantId: context.tenantId,
   userId: context.userId,
   employeeId: context.employeeId,
  });

  // Först: Hämta nuvarande entry för att logga före/efter
  const { data: beforeEntry } = await context.adminSupabase
   .from('time_entries')
   .select('id, approval_status, approved_at, approved_by')
   .eq('id', id)
   .eq('tenant_id', context.tenantId)
   .maybeSingle();

  console.log('[Approve Time Entry] Entry before update:', beforeEntry);

  const columnSet = await getTimeEntryColumnSet(context.adminSupabase);
  
  console.log('[Approve Single] Column set:', {
   hasStatus: columnSet.has('status'),
   hasApprovalStatus: columnSet.has('approval_status'),
   hasApprovedAt: columnSet.has('approved_at'),
   hasApprovedBy: columnSet.has('approved_by'),
   size: columnSet.size,
   allColumns: Array.from(columnSet).slice(0, 10),
  });
  
  const updates: Record<string, any> = {};

  // CRITICAL: Eftersom migrationen har körts, försök alltid uppdatera approval_status
  // även om columnSet är tom (information_schema kan vara otillgänglig)
  updates.approval_status = 'approved';
  updates.approved_at = new Date().toISOString();
  
  // CRITICAL: approved_by refererar till public.employees(id), INTE auth.users(id)
  // Använd employeeId istället för userId
  if (context.employeeId) {
   updates.approved_by = context.employeeId;
   console.log('[Approve Single] Using employeeId for approved_by:', context.employeeId);
  } else {
   console.warn('[Approve Single] No employeeId found, setting approved_by to null');
   // approved_by kan vara null enligt migrationen
   updates.approved_by = null;
  }
  
  // Legacy 'status' kolumn - endast om den faktiskt finns (för att undvika fel)
  if (columnSet.has('status')) {
   updates.status = 'approved';
  }

  console.log('[Approve Single] Updates to apply:', updates);

  const { data, error } = await context.adminSupabase
   .from('time_entries')
   .update(updates)
   .eq('tenant_id', context.tenantId)
   .eq('id', id)
   .select('id, approval_status, approved_at, approved_by');

  if (error) {
   console.error('❌ Failed to approve time entry:', error);
   return NextResponse.json({ error: error.message || 'Failed to approve time entry' }, { status: 500 });
  }

  const updatedCount = data?.length ?? 0;
  const updatedEntry = data?.[0];

  console.log('[Approve Time Entry] ✅ Entry approved successfully', {
   entryId: id,
   updatedCount,
   before: beforeEntry?.approval_status,
   after: updatedEntry?.approval_status,
   approvedAt: updatedEntry?.approved_at,
   approvedBy: updatedEntry?.approved_by,
  });

  // Vänta 500ms för att säkerställa Supabase commit
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json({
   success: true,
   entryId: id,
   updated: updatedCount,
   data: updatedEntry,
   message: 'Tidrapport godkänd',
  });
 } catch (err: any) {
  if (err instanceof TimeEntryContextError) {
   return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('❌ Unexpected error approving time entry:', err);
  return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
 }
}
