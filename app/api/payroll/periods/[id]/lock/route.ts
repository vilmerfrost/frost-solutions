import { NextRequest, NextResponse } from 'next/server';
import { lockPeriod } from '@/lib/payroll/periods';
import { extractErrorMessage } from '@/lib/errorUtils';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

export async function POST(
 req: NextRequest, 
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

  let force = false;
  const url = new URL(req.url);
  if (url.searchParams.get('force') === 'true') {
   force = true;
  }

  const contentType = req.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
   try {
    const body = await req.json();
    if (body && typeof body.force !== 'undefined') {
     force = Boolean(body.force);
    }
   } catch (err) {
    // ignore JSON parsing errors for empty bodies
   }
  }

  if (force) {
   const adminClient = createAdminClient();
   const { data: employee } = await adminClient
    .from('employees')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

   const role = (employee?.role || '').toLowerCase();
   if (role !== 'admin') {
    return NextResponse.json(
     { success: false, error: 'Endast administratörer kan tvinga låsning' },
     { status: 403 }
    );
   }
  }

  const result = await lockPeriod(id, user.id, { force });
  return NextResponse.json(
   { success: result.ok, errors: result.errors ?? [], warnings: result.warnings ?? [], forced: result.forced ?? false }, 
   { status: result.ok ? 200 : 409 }
  );
 } catch (e: any) {
  return NextResponse.json(
   { success: false, error: extractErrorMessage(e) }, 
   { status: 500 }
  );
 }
}

