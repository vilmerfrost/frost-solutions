import { NextRequest, NextResponse } from 'next/server';
import { exportPeriod } from '@/lib/payroll/periods';
import { extractErrorMessage } from '@/lib/errorUtils';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

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

    const adminClient = createAdminClient();
    const { data: employee } = await adminClient
      .from('employees')
      .select('role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    const role = (employee?.role || '').toLowerCase();
    if (role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Endast administratörer kan exportera löneperioder' },
        { status: 403 }
      );
    }

    const res = await exportPeriod(id, user.id);
    return NextResponse.json({ 
      success: true, 
      data: res, 
      warnings: res.warnings ?? [] 
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: extractErrorMessage(e) }, 
      { status: 500 }
    );
  }
}

