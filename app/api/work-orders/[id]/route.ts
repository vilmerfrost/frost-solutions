// app/api/work-orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import { UpdateWorkOrderSchema } from '@/lib/schemas/work-order';
import { getTenantId, verifyWorkOrderAccess, getUserRole, requireAdminOrThrow } from '@/lib/work-orders/helpers';

export async function GET(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const tenantId = await getTenantId();

  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittades.' }, { status: 403 });
  }

  const { id } = await params;
  await verifyWorkOrderAccess(tenantId, id);

  // Use admin client to bypass RLS (we verify tenant_id manually)
  const admin = createAdminClient();

  const { data, error } = await admin
   .from('work_orders')
   .select(`
    *,
    project:projects(id, name),
    assigned:employees(id, full_name)
   `)
   .eq('id', id)
   .eq('tenant_id', tenantId) // Extra security check
   .single();

  if (error) {
   console.error('Error fetching work order:', error);
   return NextResponse.json(
    { error: extractErrorMessage(error) },
    { status: 500 }
   );
  }

  if (!data) {
   return NextResponse.json(
    { error: 'Arbetsorder hittades inte.' },
    { status: 404 }
   );
  }

  // Get photo count
  const { count } = await admin
   .from('work_order_photos')
   .select('*', { count: 'exact', head: true })
   .eq('work_order_id', id);

  return NextResponse.json({
   ...data,
   photos_count: count ?? 0
  });
 } catch (e) {
  console.error('Error in GET /api/work-orders/[id]:', e);
  const status = (e as any)?.status ?? 500;
  return NextResponse.json(
   { error: (e as Error).message },
   { status }
  );
 }
}

export async function PUT(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const body = await req.json();
  const parsed = UpdateWorkOrderSchema.parse(body);

  // Use regular client for auth (has session)
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
   return NextResponse.json({ error: 'Du är inte inloggad.' }, { status: 401 });
  }

  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittades.' }, { status: 403 });
  }

  const { id } = await params;
  await verifyWorkOrderAccess(tenantId, id);

  // Permission: admin or creator
  const role = await getUserRole();
  const admin = createAdminClient();
  
  if (role !== 'admin') {
   const { data: wo } = await admin
    .from('work_orders')
    .select('created_by')
    .eq('id', id)
    .single();

   if (wo?.created_by !== user.id) {
    return NextResponse.json(
     { error: 'Du har inte behörighet att uppdatera denna arbetsorder.' },
     { status: 403 }
    );
   }
  }
  
  // Get current work order to check if assigned_to changed
  const { data: currentWo } = await admin
   .from('work_orders')
   .select('assigned_to, number, title')
   .eq('id', id)
   .single();
  
  const { data, error } = await admin
   .from('work_orders')
   .update(parsed)
   .eq('id', id)
   .select('*')
   .single();

  if (error) {
   return NextResponse.json(
    { error: extractErrorMessage(error) },
    { status: 500 }
   );
  }
  
  // Send notification if assigned_to changed and is now set
  if (!error && data && parsed.assigned_to && currentWo?.assigned_to !== parsed.assigned_to) {
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
       title: 'Arbetsorder tilldelad',
       message: `Du har blivit tilldelad arbetsordern "${currentWo?.title || data.title}" (#${currentWo?.number || data.number})`,
       link: `/work-orders/${id}`,
       created_by: user.id,
      });
    }
   } catch (notifError) {
    // Don't fail the request if notification fails
    console.error('Failed to send notification:', notifError);
   }
  }

  return NextResponse.json(data);
 } catch (e) {
  if (e instanceof z.ZodError) {
   return NextResponse.json(
    { error: e.issues[0]?.message ?? 'Ogiltig indata.' },
    { status: 400 }
   );
  }
  const status = (e as any)?.status ?? 500;
  return NextResponse.json(
   { error: (e as Error).message },
   { status }
  );
 }
}

export async function DELETE(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  await requireAdminOrThrow();

  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittades.' }, { status: 403 });
  }

  const { id } = await params;
  await verifyWorkOrderAccess(tenantId, id);

  const admin = createAdminClient();
  const { error } = await admin
   .from('work_orders')
   .delete()
   .eq('id', id);

  if (error) {
   return NextResponse.json(
    { error: extractErrorMessage(error) },
    { status: 500 }
   );
  }

  return new NextResponse(null, { status: 204 });
 } catch (e) {
  const status = (e as any)?.status ?? 500;
  return NextResponse.json(
   { error: (e as Error).message },
   { status }
  );
 }
}

