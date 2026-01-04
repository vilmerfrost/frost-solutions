import { NextRequest, NextResponse } from 'next/server';
import { unlockPeriod } from '@/lib/payroll/periods';
import { extractErrorMessage } from '@/lib/errorUtils';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST(
 _: NextRequest, 
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
   return NextResponse.json(
    { success: false, error: 'Unauthorized' }, 
    { status: 401 }
   );
  }

  const { ok } = await unlockPeriod(id, user.id);
  return NextResponse.json({ success: ok });
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) }, 
   { status: 500 }
  );
 }
}

