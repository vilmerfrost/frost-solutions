// app/api/sync/work-orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';
import { getTenantId } from '@/lib/work-orders/helpers';

const UUID = z.string().uuid();
const ISO = z.string().datetime();

const Upsert = z.object({
 client_change_id: z.string().min(1),
 id: UUID.optional(),
 base_updated_at: ISO.nullable().optional(),
 new_values: z.record(z.any())
});

const Del = z.object({
 client_change_id: z.string().min(1),
 id: UUID
});

const BodySchema = z.object({
 tenant_id: UUID,
 changes: z.object({
  work_orders: z.object({
   upserts: z.array(Upsert).default([]),
   deletes: z.array(Del).default([])
  })
 })
});

function bad(msg: string, status = 400) {
 return NextResponse.json({ error: msg }, { status });
}

/**
 * POST /api/sync/work-orders
 * Push offline changes to server
 */
export async function POST(req: NextRequest) {
 try {
  const body = await req.json();
  const parsed = BodySchema.parse(body);

  const tenantId = await getTenantId();
  if (!tenantId) {
   return bad('Ingen tenant hittad', 403);
  }

  if (tenantId !== parsed.tenant_id) {
   return bad('Felaktig tenant.', 403);
  }

  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
   return bad('Du är inte inloggad.', 401);
  }

  const admin = createAdminClient();

  const out = {
   synced: [] as any[],
   conflicts: [] as any[],
   rejected: [] as any[]
  };

  // UPSERTS (create/update) med LWW server-sida
  for (const u of parsed.changes.work_orders.upserts) {
   try {
    const current = u.id
     ? await admin
       .from('work_orders')
       .select('*')
       .eq('id', u.id)
       .eq('tenant_id', tenantId)
       .maybeSingle()
     : { data: null, error: null };

    if ((current as any).error && (current as any).error.code !== 'PGRST116') {
     out.rejected.push({
      client_change_id: u.client_change_id,
      id: u.id ?? null,
      reason: extractErrorMessage((current as any).error)
     });
     continue;
    }

    const serverRow = (current as any).data;

    // Check for conflict: server has newer version
    if (
     serverRow &&
     u.base_updated_at &&
     new Date(serverRow.updated_at).getTime() > new Date(u.base_updated_at).getTime()
    ) {
     // Server nyare → LWW: servern vinner
     out.conflicts.push({
      client_change_id: u.client_change_id,
      id: serverRow.id,
      client: { ...u.new_values, updated_at: u.base_updated_at },
      server: serverRow
     });
     continue;
    }

    // Upsert
    const row = {
     ...u.new_values,
     tenant_id: tenantId,
     id: u.id ?? undefined,
     updated_at: new Date().toISOString(),
     deleted_at: null
    };

    const { data, error } = await admin
     .from('work_orders')
     .upsert(row, { onConflict: 'id' })
     .select('*')
     .single();

    if (error) {
     out.rejected.push({
      client_change_id: u.client_change_id,
      id: u.id ?? null,
      reason: extractErrorMessage(error)
     });
     continue;
    }

    out.synced.push({
     client_change_id: u.client_change_id,
     id: data.id,
     row: data
    });
   } catch (err) {
    console.error('Error processing upsert:', err);
    out.rejected.push({
     client_change_id: u.client_change_id,
     id: u.id ?? null,
     reason: extractErrorMessage(err)
    });
   }
  }

  // DELETES → soft delete
  for (const d of parsed.changes.work_orders.deletes) {
   try {
    const { data: cur, error } = await admin
     .from('work_orders')
     .select('id, deleted_at')
     .eq('id', d.id)
     .eq('tenant_id', tenantId)
     .single();

    if (error) {
     out.rejected.push({
      client_change_id: d.client_change_id,
      id: d.id,
      reason: extractErrorMessage(error)
     });
     continue;
    }

    if (!cur?.deleted_at) {
     const { error: delErr } = await admin
      .from('work_orders')
      .update({
       deleted_at: new Date().toISOString(),
       updated_at: new Date().toISOString()
      })
      .eq('id', d.id);

     if (delErr) {
      out.rejected.push({
       client_change_id: d.client_change_id,
       id: d.id,
       reason: extractErrorMessage(delErr)
      });
      continue;
     }
    }

    out.synced.push({
     client_change_id: d.client_change_id,
     id: d.id,
     deleted: true
    });
   } catch (err) {
    console.error('Error processing delete:', err);
    out.rejected.push({
     client_change_id: d.client_change_id,
     id: d.id,
     reason: extractErrorMessage(err)
    });
   }
  }

  return NextResponse.json(out);
 } catch (e) {
  if (e instanceof z.ZodError) {
   return NextResponse.json(
    { error: e.errors[0]?.message ?? 'Ogiltig data.' },
    { status: 400 }
   );
  }

  console.error('Error in POST /api/sync/work-orders:', e);
  return NextResponse.json(
   { error: extractErrorMessage(e) },
   { status: 500 }
  );
 }
}

/**
 * GET /api/sync/work-orders?since=ISO&limit=100
 * Pull changes from server (updated_at > since)
 */
export async function GET(req: NextRequest) {
 try {
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittad' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

  const admin = createAdminClient();

  let q = admin
   .from('work_orders')
   .select('*')
   .eq('tenant_id', tenantId)
   .order('updated_at', { ascending: true })
   .limit(limit);

  // Filter by updated_at or deleted_at if since is provided
  if (since) {
   q = q.or(`updated_at.gt.${since},deleted_at.gt.${since}`);
  }

  const { data, error } = await q;

  if (error) {
   console.error('Error fetching sync data:', error);
   return NextResponse.json(
    { error: extractErrorMessage(error) },
    { status: 500 }
   );
  }

  const cursor = new Date().toISOString();

  return NextResponse.json({
   cursor,
   data: data ?? []
  });
 } catch (e) {
  console.error('Error in GET /api/sync/work-orders:', e);
  return NextResponse.json(
   { error: extractErrorMessage(e) },
   { status: 500 }
  );
 }
}

