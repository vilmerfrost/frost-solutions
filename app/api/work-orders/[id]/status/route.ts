// app/api/work-orders/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { UpdateStatusSchema } from '@/lib/schemas/work-order';
import { WorkOrderStateMachine, type WorkOrderStatus } from '@/lib/work-order-state-machine';
import { getTenantId, getUserRole, verifyWorkOrderAccess } from '@/lib/work-orders/helpers';
import { extractErrorMessage } from '@/lib/errorUtils';

export async function PATCH(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const body = await req.json();
  const parsed = UpdateStatusSchema.parse(body);

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

  const { data: wo, error: woErr } = await supabase
   .from('work_orders')
   .select('id, status')
   .eq('id', id)
   .single();

  if (woErr || !wo) {
   return NextResponse.json(
    { error: 'Arbetsorder hittades inte.' },
    { status: 404 }
   );
  }

  const role = await getUserRole();
  const err = WorkOrderStateMachine.getTransitionError(
   wo.status as WorkOrderStatus,
   parsed.to_status,
   role
  );

  if (err) {
   return NextResponse.json({ error: err }, { status: 400 });
  }

  const admin = createAdminClient();
  const update: any = { status: parsed.to_status };

  // Set approved fields if transitioning to 'approved'
  if (parsed.to_status === 'approved') {
   update.approved_by = user.id;
   update.approved_at = new Date().toISOString();
  }

  if (parsed.to_status === 'completed') {
   update.completed_at = new Date().toISOString();
  }

  const { data, error } = await admin
   .from('work_orders')
   .update(update)
   .eq('id', id)
   .select('*')
   .single();

  if (error) {
   return NextResponse.json(
    { error: extractErrorMessage(error) },
    { status: 500 }
   );
  }

  // Log status change in history (changed_by = me.user.id)
  // Note: The trigger will also log, but we want to include the reason from API
  await admin
   .from('work_order_status_history')
   .insert({
    work_order_id: id,
    from_status: wo.status,
    to_status: parsed.to_status,
    changed_by: user.id,
    reason: parsed.reason ?? null
   })
   .catch(() => {}); // Ignore errors from history insert (trigger handles it too)

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

