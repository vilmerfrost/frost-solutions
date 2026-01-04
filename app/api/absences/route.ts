// app/api/absences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { getTenantId } from '@/lib/serverTenant';
import { createAbsenceSchema } from '@/lib/validation/scheduling';

function badRequest(message: string) {
 return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
 try {
  const body = await req.json();
  const parsed = createAbsenceSchema.parse(body);

  const start = new Date(parsed.start_date);
  const end  = new Date(parsed.end_date);
  if (end < start) return badRequest('end_date must be >= start_date');

  const supabase = createClient();
  const tenantId = await getTenantId();

  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
  }

  // Use admin client to write to app.absences via public view
  const admin = createAdminClient();
  const { data, error } = await admin
   .from('absences')
   .insert({
    tenant_id: tenantId,
    employee_id: parsed.employee_id,
    start_date: parsed.start_date,
    end_date: parsed.end_date,
    type: parsed.type,
    status: 'pending',
    reason: parsed.reason ?? null
   })
   .select()
   .single();

  if (error) return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
 } catch (e) {
  if (e instanceof z.ZodError) return badRequest(e.issues[0]?.message ?? 'Invalid payload');
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}

export async function GET(req: NextRequest) {
 try {
  // Use admin client to access app.absences via public view
  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);

  const employee_id = searchParams.get('employee_id');
  const start_date = searchParams.get('start_date');
  const end_date  = searchParams.get('end_date');
  const status   = searchParams.get('status');

  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
  }

  // Use public view (which points to app.absences)
  let q = admin.from('absences').select('*').eq('tenant_id', tenantId);

  if (employee_id) q = q.eq('employee_id', employee_id);
  if (status)   q = q.eq('status', status);
  if (start_date) q = q.gte('start_date', start_date);
  if (end_date)  q = q.lte('end_date', end_date);

  const { data, error } = await q.order('start_date', { ascending: true });

  if (error) return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });
  return NextResponse.json(data ?? []);
 } catch (e) {
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}
