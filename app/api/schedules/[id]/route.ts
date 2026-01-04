// app/api/schedules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';
import { getTenantId } from '@/lib/serverTenant';
import { updateScheduleSchema } from '@/lib/validation/scheduling';
import { findConflicts } from '@/lib/scheduling/conflicts';

function badRequest(message: string) {
 return NextResponse.json({ error: message }, { status: 400 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 try {
  const body = await req.json();
  const parsed = updateScheduleSchema.parse(body);

  const supabase = createClient();

  // Load current slot to know employee_id for conflict checks & tenant via RLS
  const { data: current, error: getErr } = await supabase
   .from('schedule_slots').select('*').eq('id', id).single();

  if (getErr) return NextResponse.json({ error: extractErrorMessage(getErr) }, { status: 404 });

  const start = parsed.start_time ? new Date(parsed.start_time) : new Date(current.start_time);
  const end  = parsed.end_time  ? new Date(parsed.end_time)  : new Date(current.end_time);
  if (!(start < end)) return badRequest('end_time must be greater than start_time');
  if ((+end - +start) / 36e5 > 12) return badRequest('duration must be <= 12 hours');

  // Determine which employee_id to check conflicts for
  const employeeIdToCheck = parsed.employee_id ?? current.employee_id;
  
  // Check conflicts for the employee (exclude this schedule id)
  const tenantId = (await getTenantId()) ?? current.tenant_id;
  if (tenantId) {
   const conf = await findConflicts(tenantId, employeeIdToCheck, start.toISOString(), end.toISOString(), id);
   if (conf.hasConflict) {
    return NextResponse.json({ error: 'Conflict detected', details: conf.conflicts }, { status: 409 });
   }
  }

      const updatePayload: any = {
       start_time: parsed.start_time ?? undefined,
       end_time: parsed.end_time ?? undefined,
       status: parsed.status ?? undefined,
       notes: parsed.notes ?? undefined,
       employee_id: parsed.employee_id ?? undefined,
       project_id: parsed.project_id ?? undefined,
      };

      // Add optional fields if provided
      if (parsed.shift_type !== undefined) {
       updatePayload.shift_type = parsed.shift_type;
      }
      if (parsed.transport_time_minutes !== undefined) {
       updatePayload.transport_time_minutes = parsed.transport_time_minutes;
      }

  const { data, error } = await supabase
   .from('schedule_slots')
   .update(updatePayload)
   .eq('id', id)
   .select()
   .single();

  if (error) {
   const msg = extractErrorMessage(error);
   const status = msg.includes('prevent_double_booking') ? 409 : 500;
   return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json(data);
 } catch (e) {
  if (e instanceof z.ZodError) return badRequest(e.issues[0]?.message ?? 'Invalid payload');
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 try {
  const supabase = createClient();
  const { error } = await supabase.from('schedule_slots').delete().eq('id', id);
  if (error) return NextResponse.json({ error: extractErrorMessage(error) }, { status: 403 });
  return new NextResponse(null, { status: 204 });
 } catch (e) {
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}
