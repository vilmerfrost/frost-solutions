import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
 try {
  const tenantId = await getTenantId();

  if (!tenantId) {
   return NextResponse.json(
    { error: 'Unauthorized - No tenant found' },
    { status: 401 }
   );
  }

  // Verify user authentication
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
   return NextResponse.json(
    { error: 'Unauthorized - Not authenticated' },
    { status: 401 }
   );
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') || 'month') as 'week' | 'month' | 'year';

  const admin = createAdminClient();

  // Calculate date range
  const now = new Date();
  let startDate: Date;

  if (period === 'week') {
   startDate = new Date(now);
   startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
   startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
   startDate = new Date(now.getFullYear(), 0, 1);
  }

  // Fetch time entries
  const { data: timeEntries, error: timeEntriesError } = await admin
   .from('time_entries')
   .select('hours_total, amount_total, date, is_billed')
   .eq('tenant_id', tenantId)
   .gte('date', startDate.toISOString().split('T')[0]);

  if (timeEntriesError) {
   console.error('Error fetching time entries:', timeEntriesError);
   return NextResponse.json(
    { error: 'Failed to fetch time entries', details: timeEntriesError.message },
    { status: 500 }
   );
  }

  // Fetch invoices
  const { data: invoices, error: invoicesError } = await admin
   .from('invoices')
   .select('amount, status, created_at')
   .eq('tenant_id', tenantId)
   .gte('created_at', startDate.toISOString());

  if (invoicesError) {
   console.error('Error fetching invoices:', invoicesError);
   return NextResponse.json(
    { error: 'Failed to fetch invoices', details: invoicesError.message },
    { status: 500 }
   );
  }

  // Fetch projects
  const { data: projects, error: projectsError } = await admin
   .from('projects')
   .select('status')
   .eq('tenant_id', tenantId);

  if (projectsError) {
   console.error('Error fetching projects:', projectsError);
   return NextResponse.json(
    { error: 'Failed to fetch projects', details: projectsError.message },
    { status: 500 }
   );
  }

  // Fetch employees
  const { data: employees, error: employeesError } = await admin
   .from('employees')
   .select('id')
   .eq('tenant_id', tenantId);

  if (employeesError) {
   console.error('Error fetching employees:', employeesError);
   return NextResponse.json(
    { error: 'Failed to fetch employees', details: employeesError.message },
    { status: 500 }
   );
  }

  // Calculate stats
  const totalHours = (timeEntries || []).reduce((sum, e) => sum + Number(e.hours_total || 0), 0);
  const totalRevenue = (invoices || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const activeProjects = (projects || []).filter((p: any) => p.status === 'active').length;
  const employeesCount = (employees || []).length;

  // Group by month
  const hoursByMonthMap = new Map<string, number>();
  const revenueByMonthMap = new Map<string, number>();

  (timeEntries || []).forEach((entry: any) => {
   const month = new Date(entry.date).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short' });
   hoursByMonthMap.set(month, (hoursByMonthMap.get(month) || 0) + Number(entry.hours_total || 0));
  });

  (invoices || []).forEach((inv: any) => {
   if (inv.status === 'paid') {
    const month = new Date(inv.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short' });
    revenueByMonthMap.set(month, (revenueByMonthMap.get(month) || 0) + Number(inv.amount || 0));
   }
  });

  const hoursByMonth = Array.from(hoursByMonthMap.entries()).map(([month, hours]) => ({ month, hours }));
  const revenueByMonth = Array.from(revenueByMonthMap.entries()).map(([month, revenue]) => ({ month, revenue }));

  // Project status breakdown
  const statusMap = new Map<string, number>();
  (projects || []).forEach((p: any) => {
   const status = p.status || 'unknown';
   statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });
  const projectStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  return NextResponse.json({
   success: true,
   data: {
    totalHours,
    totalRevenue,
    activeProjects,
    employeesCount,
    hoursByMonth,
    revenueByMonth,
    projectStatus,
   },
  });
 } catch (error: any) {
  console.error('Error in analytics API:', error);
  return NextResponse.json(
   {
    success: false,
    error: error.message || 'Failed to fetch analytics',
    details: error.details || null,
   },
   { status: 500 }
  );
 }
}

