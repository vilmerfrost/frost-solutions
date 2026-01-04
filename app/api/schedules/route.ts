// app/api/schedules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { getTenantId } from '@/lib/serverTenant';
import { createScheduleSchema } from '@/lib/validation/scheduling';
import { findConflicts } from '@/lib/scheduling/conflicts';

function badRequest(message: string) {
 return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
 try {
  const body = await req.json();
  const parsed = createScheduleSchema.parse(body);

  const supabase = createClient();
  const tenantId = await getTenantId();

  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
  }

  const start = new Date(parsed.start_time);
  const end = new Date(parsed.end_time);

  if (!(start < end)) return badRequest('end_time must be greater than start_time');
  if ((+end - +start) / 36e5 > 12) return badRequest('duration must be <= 12 hours');

  // Soft conflict check for DX (DB EXCLUDE handles races)
  const conf = await findConflicts(tenantId, parsed.employee_id, parsed.start_time, parsed.end_time);
  if (conf.hasConflict) {
   return NextResponse.json({ error: 'Conflict detected', details: conf.conflicts }, { status: 409 });
  }

  // Get current user for created_by
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const insertPayload: any = {
   tenant_id: tenantId,
   employee_id: parsed.employee_id,
   project_id: parsed.project_id,
   start_time: parsed.start_time,
   end_time: parsed.end_time,
   status: parsed.status ?? 'scheduled',
   notes: parsed.notes ?? null,
   created_by: user.id
  };

  // Add optional fields if provided
  if (parsed.shift_type) {
   insertPayload.shift_type = parsed.shift_type;
  }
  if (parsed.transport_time_minutes !== undefined) {
   insertPayload.transport_time_minutes = parsed.transport_time_minutes;
  }

  // Use admin client to write to app.schedule_slots (bypasses RLS)
  const admin = createAdminClient();
  const { data, error } = await admin
   .from('schedule_slots')
   .insert(insertPayload)
   .select()
   .single();

  if (error) {
   // EXCLUDE conflicts surface here as 409
   const msg = extractErrorMessage(error);
   const status = msg.includes('prevent_double_booking') ? 409 : 500;
   return NextResponse.json({ error: msg }, { status });
  }

  // Send notification to the employee about the new schedule
  try {
   // Get employee info to send notification
   const { data: employeeData } = await admin
    .from('employees')
    .select('auth_user_id, full_name')
    .eq('id', parsed.employee_id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

   if (employeeData?.auth_user_id) {
    // Get project name for notification
    const { data: projectData } = await admin
     .from('projects')
     .select('name')
     .eq('id', parsed.project_id)
     .eq('tenant_id', tenantId)
     .maybeSingle();

    const projectName = projectData?.name || 'Ett projekt';
    const startDate = new Date(parsed.start_time).toLocaleDateString('sv-SE', {
     weekday: 'short',
     day: 'numeric',
     month: 'short',
     hour: '2-digit',
     minute: '2-digit',
    });

    // Create notification
    await admin
     .from('notifications')
     .insert({
      tenant_id: tenantId,
      created_by: user.id,
      recipient_id: employeeData.auth_user_id,
      recipient_employee_id: parsed.employee_id,
      type: 'info',
      title: 'Du har schemalagts på ett pass',
      message: `Du har schemalagts på ${projectName} den ${startDate}`,
      link: `/calendar`,
      read: false,
     });
   }
  } catch (notifError) {
   // Log but don't fail the schedule creation if notification fails
   console.error('Failed to send notification:', notifError);
  }

  return NextResponse.json(data, { status: 201 });
 } catch (e) {
  if (e instanceof z.ZodError) return badRequest(e.issues[0]?.message ?? 'Invalid payload');
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}

export async function GET(req: NextRequest) {
 try {
  // Use admin client to access app.schedule_slots via public view
  const admin = createAdminClient();
  const tenantId = await getTenantId();

  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const employee_id = searchParams.get('employee_id');
  const project_id = searchParams.get('project_id');
  const start_date = searchParams.get('start_date'); // YYYY-MM-DD
  const end_date  = searchParams.get('end_date');  // YYYY-MM-DD
  const status   = searchParams.get('status');

  // Use public view (which points to app.schedule_slots)
  let q = admin.from('schedule_slots').select('*').eq('tenant_id', tenantId);

  if (employee_id) q = q.eq('employee_id', employee_id);
  if (project_id) q = q.eq('project_id', project_id);
  if (status)   q = q.eq('status', status);
  if (start_date) q = q.gte('start_time', `${start_date}T00:00:00Z`);
  if (end_date)  q = q.lte('end_time',  `${end_date}T23:59:59Z`);

  const { data, error } = await q.order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });
  return NextResponse.json(data ?? []);
 } catch (e) {
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}

