// app/api/schedules/conflicts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';
import { getTenantId } from '@/lib/serverTenant';

export async function GET(req: NextRequest) {
 try {
  const { searchParams } = new URL(req.url);
  const employee_id = searchParams.get('employee_id');
  const start_time = searchParams.get('start_time');
  const end_time  = searchParams.get('end_time');
  const exclude_id = searchParams.get('exclude_id');

  if (!employee_id || !start_time || !end_time) {
   return NextResponse.json({ error: 'employee_id, start_time, end_time are required' }, { status: 400 });
  }

  const supabase = createClient();
  const tenant_id = await getTenantId();

  if (!tenant_id) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
  }

  const { data, error } = await supabase.rpc('find_schedule_conflicts', {
   p_tenant_id: tenant_id,
   p_employee_id: employee_id,
   p_start: start_time,
   p_end: end_time,
   p_exclude_id: exclude_id
  });

  if (error) return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });

  return NextResponse.json({
   hasConflict: (data?.length ?? 0) > 0,
   conflicts: (data ?? []).map((s: any) => ({ id: s.id, start_time: s.start_time, end_time: s.end_time, status: s.status }))
  });
 } catch (e) {
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}
