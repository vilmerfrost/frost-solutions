// app/api/schedules/[id]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
  const { id } = await params;
  const supabase = createClient();

  // Mark schedule completed first (respects RLS)
  const { data: updated, error: upErr } = await supabase
   .from('schedule_slots')
   .update({ status: 'completed' })
   .eq('id', id)
   .select()
   .single();

  if (upErr) return NextResponse.json({ error: extractErrorMessage(upErr) }, { status: 403 });

  // DB trigger already created the time entry. We can fetch it by source_schedule_id:
  const { data: te, error: teErr } = await supabase
   .from('time_entries')
   .select('*')
   .eq('source_schedule_id', id)
   .single();

  if (teErr) {
   // As fallback, call RPC to ensure creation
   const { data: te2, error: rpcErr } = await supabase.rpc('create_time_entry_from_schedule', {
    p_schedule_id: id
   });
   if (rpcErr) return NextResponse.json({ error: extractErrorMessage(rpcErr) }, { status: 500 });
   return NextResponse.json({ schedule: updated, timeEntry: te2 });
  }

  return NextResponse.json({ schedule: updated, timeEntry: te });
 } catch (e) {
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}
