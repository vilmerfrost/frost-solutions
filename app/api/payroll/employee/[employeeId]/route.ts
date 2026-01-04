// app/api/payroll/employee/[employeeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ employeeId: string }> }
) {
 try {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
   return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
   );
  }

  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json(
    { success: false, error: 'No tenant found' },
    { status: 400 }
   );
  }

  const { employeeId } = await params;
  const url = new URL(req.url);
  const month = url.searchParams.get('month'); // Format: YYYY-MM

  // Calculate date range from month
  let start: string;
  let end: string;
  
  if (month && /^\d{4}-\d{2}$/.test(month)) {
   const [y, m] = month.split('-').map(Number);
   const startDate = new Date(y, m - 1, 1);
   const endDate = new Date(y, m, 1);
   start = startDate.toISOString().split('T')[0];
   end = endDate.toISOString().split('T')[0];
  } else {
   // Default to current month
   const now = new Date();
   const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
   const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
   start = startDate.toISOString().split('T')[0];
   end = endDate.toISOString().split('T')[0];
  }

  // Use admin client to bypass RLS (use 'public' schema for time_entries)
  const admin = createAdminClient(8000, 'public');
  
  // Fetch time entries
  const { data: entriesData, error: entriesError } = await admin
   .from('time_entries')
   .select('hours_total, ob_type, amount_total, date')
   .eq('tenant_id', tenantId)
   .eq('employee_id', employeeId)
   .gte('date', start)
   .lt('date', end)
   .order('date', { ascending: false });

  if (entriesError) {
   console.error('Error fetching time entries:', entriesError);
   return NextResponse.json(
    { success: false, error: entriesError.message || 'Failed to fetch time entries' },
    { status: 500 }
   );
  }

  return NextResponse.json({
   success: true,
   entries: entriesData || [],
   period: { start, end, month: month || null },
  });
 } catch (error: any) {
  console.error('Payroll employee API error:', error);
  return NextResponse.json(
   { success: false, error: error.message || 'Internal server error' },
   { status: 500 }
  );
 }
}

