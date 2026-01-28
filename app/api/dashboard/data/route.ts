// app/api/dashboard/data/route.ts
// Combined dashboard data endpoint - reduces multiple API calls to one
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Run all queries in parallel for better performance
    const [
      employeeResult,
      projectsResult,
      timeEntriesResult,
      invoicesResult,
    ] = await Promise.all([
      // Get employee data
      admin
        .from('employees')
        .select('id, tenant_id')
        .eq('auth_user_id', user.id)
        .eq('tenant_id', tenantId)
        .maybeSingle(),
      
      // Get active projects with hours
      admin
        .from('projects')
        .select('id, name, status, budgeted_hours, base_rate_sek')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      
      // Get this month's time entries for stats
      admin
        .from('time_entries')
        .select('hours_total, project_id')
        .eq('tenant_id', tenantId)
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      
      // Get recent invoices
      admin
        .from('invoices')
        .select('id, status, amount')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    // Process data
    const employee = employeeResult.data;
    const projects = projectsResult.data || [];
    const timeEntries = timeEntriesResult.data || [];
    const invoices = invoicesResult.data || [];

    // Filter active projects
    const activeProjects = projects.filter(p => 
      p.status !== 'completed' && p.status !== 'archived'
    );

    // Calculate project hours from time entries
    const projectHoursMap = new Map<string, number>();
    for (const entry of timeEntries) {
      if (entry.project_id) {
        const current = projectHoursMap.get(entry.project_id) || 0;
        projectHoursMap.set(entry.project_id, current + (Number(entry.hours_total) || 0));
      }
    }

    // Add hours to projects
    const projectsWithHours = activeProjects.map(p => ({
      ...p,
      hours: projectHoursMap.get(p.id) || 0,
    }));

    // Calculate stats
    const totalHours = timeEntries.reduce((sum, e) => sum + (Number(e.hours_total) || 0), 0);
    const invoicesToSend = invoices.filter(i => i.status === 'draft' || i.status === 'pending').length;

    return NextResponse.json({
      success: true,
      data: {
        employee: employee ? { id: employee.id } : null,
        projects: projectsWithHours,
        stats: {
          totalHours: Math.round(totalHours * 10) / 10,
          activeProjects: activeProjects.length,
          invoicesToSend,
        },
        tenantId,
      },
    });
  } catch (error: any) {
    console.error('[Dashboard Data] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}
