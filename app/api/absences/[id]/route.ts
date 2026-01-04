// app/api/absences/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';
import { updateAbsenceSchema } from '@/lib/validation/scheduling';

function badRequest(message: string) {
 return NextResponse.json({ error: message }, { status: 400 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateAbsenceSchema.parse(body);

  if (parsed.start_date && parsed.end_date) {
   if (new Date(parsed.end_date) < new Date(parsed.start_date)) {
    return badRequest('end_date must be >= start_date');
   }
  }

  const supabase = createClient();
  const { data, error } = await supabase
   .from('absences')
   .update(parsed)
   .eq('id', id)
   .select()
   .single();

  if (error) return NextResponse.json({ error: extractErrorMessage(error) }, { status: 403 });
  return NextResponse.json(data);
 } catch (e) {
  if (e instanceof z.ZodError) return badRequest(e.issues[0]?.message ?? 'Invalid payload');
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
  const { id } = await params;
  const supabase = createClient();
  const { error } = await supabase.from('absences').delete().eq('id', id);
  if (error) return NextResponse.json({ error: extractErrorMessage(error) }, { status: 403 });
  return new NextResponse(null, { status: 204 });
 } catch (e) {
  return NextResponse.json({ error: String(e) }, { status: 500 });
 }
}
