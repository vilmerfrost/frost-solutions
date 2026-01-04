// app/api/work-orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { CreateWorkOrderSchema } from '@/lib/schemas/work-order';
import { getTenantId, getWorkOrderNumber, getUserRole } from '@/lib/work-orders/helpers';

function badRequest(message: string) {
 return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
 try {
  const role = await getUserRole();
  
  // Both admin & manager can create. To restrict to admin only, check here.
  if (!['admin', 'manager'].includes(role)) {
   return NextResponse.json(
    { error: 'Endast administratörer/chefer får skapa arbetsorder.' },
    { status: 403 }
   );
  }

  const body = await req.json();
  const parsed = CreateWorkOrderSchema.parse(body);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
   return NextResponse.json({ error: 'Du är inte inloggad.' }, { status: 401 });
  }

  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittades.' }, { status: 403 });
  }

  let number: string;
  try {
   number = await getWorkOrderNumber(tenantId);
  } catch (error) {
   console.error('Failed to generate work order number:', error);
   // Fallback: Use timestamp-based number if RPC fails
   const year = new Date().getFullYear();
   const timestamp = Date.now().toString().slice(-6);
   number = `WO-${year}-${timestamp}`;
   console.warn('Using fallback work order number:', number);
  }
  
  const admin = createAdminClient();

  const { data, error } = await admin
   .from('work_orders')
   .insert({
    tenant_id: tenantId,
    number,
    title: parsed.title,
    description: parsed.description ?? null,
    project_id: parsed.project_id ?? null,
    assigned_to: parsed.assigned_to ?? null,
    created_by: user.id,
    status: 'new',
    priority: parsed.priority ?? 'medium',
    scheduled_date: parsed.scheduled_date ?? null,
    scheduled_start_time: parsed.scheduled_start_time ?? null,
    scheduled_end_time: parsed.scheduled_end_time ?? null
   })
   .select('*')
   .single();
  
  // Send notification if assigned to someone
  if (!error && data && parsed.assigned_to) {
   try {
    // Get employee's auth_user_id
    const { data: employee } = await admin
     .from('employees')
     .select('auth_user_id, full_name')
     .eq('id', parsed.assigned_to)
     .eq('tenant_id', tenantId)
     .single();
    
    if (employee?.auth_user_id) {
     // Send notification
     await admin
      .from('notifications')
      .insert({
       tenant_id: tenantId,
       recipient_id: employee.auth_user_id,
       type: 'info',
       title: 'Ny arbetsorder tilldelad',
       message: `Du har blivit tilldelad arbetsordern "${parsed.title}" (#${number})`,
       link: `/work-orders/${data.id}`,
       created_by: user.id,
      });
    }
   } catch (notifError) {
    // Don't fail the request if notification fails
    console.error('Failed to send notification:', notifError);
   }
  }

  if (error) {
   return NextResponse.json(
    { error: extractErrorMessage(error) },
    { status: 500 }
   );
  }

  return NextResponse.json(data, { status: 201 });
 } catch (e) {
  console.error('Error creating work order:', e);
  if (e instanceof z.ZodError) {
   return badRequest(e.issues[0]?.message ?? 'Ogiltig indata.');
  }
  const status = (e as any)?.status ?? 500;
  const errorMessage = (e as Error).message || 'Internt fel';
  console.error('Work order creation error:', errorMessage);
  return NextResponse.json(
   { error: errorMessage },
   { status }
  );
 }
}

export async function GET(req: NextRequest) {
 try {
  const tenantId = await getTenantId();

  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittades.' }, { status: 403 });
  }

  // Use admin client to bypass RLS (we verify tenant_id manually)
  const admin = createAdminClient();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const project_id = searchParams.get('project_id');
  const assigned_to = searchParams.get('assigned_to');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

  let q = admin
   .from('work_orders')
   .select('*')
   .eq('tenant_id', tenantId)
   .order('created_at', { ascending: false })
   .range(offset, offset + limit - 1);

  if (status) q = q.eq('status', status);
  if (priority) q = q.eq('priority', priority);
  if (project_id) q = q.eq('project_id', project_id);
  if (assigned_to) q = q.eq('assigned_to', assigned_to);

  const { data, error } = await q;

  if (error) {
   console.error('Error fetching work orders:', error);
   return NextResponse.json(
    { error: extractErrorMessage(error) },
    { status: 500 }
   );
  }

  return NextResponse.json(data ?? []);
 } catch (e) {
  console.error('Error in GET /api/work-orders:', e);
  return NextResponse.json(
   { error: (e as Error).message || 'Internt fel' },
   { status: 500 }
  );
 }
}

