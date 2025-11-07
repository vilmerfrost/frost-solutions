import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const adminPublic = createAdminClient(8000, 'public');
    const adminApp = createAdminClient(8000, 'app');
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'month'; // 'week', 'month', 'year'

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Always use direct queries for accurate, real-time data
    // (RPC might be cached or return stale data)
    console.log('📊 Dashboard Analytics: Fetching data for tenant:', tenantId);
    
    // Fetch projects directly for stats
    const { data: projectsForStats } = await adminPublic
      .from('projects')
      .select('id, status, budgeted_hours')
      .eq('tenant_id', tenantId);
    
    // Count active projects (not completed or archived)
    const activeProjects = (projectsForStats || []).filter(p => 
      p.status !== 'completed' && p.status !== 'archived'
    ).length;
    
    const totalBudgetedHours = (projectsForStats || []).reduce((sum, p) => 
      sum + Number(p.budgeted_hours || 0), 0
    );
    
    // Fetch ALL time entries (not just for period) for total hours
    let { data: allTimeEntries, error: timeEntriesError } = await adminApp
      .from('time_entries')
      .select('hours_total, is_billed, date')
      .eq('tenant_id', tenantId);

    if (timeEntriesError) {
      console.warn('⚠️ time_entries (app schema) lookup failed, retrying via public view:', timeEntriesError);
      const fallback = await adminPublic
        .from('time_entries')
        .select('hours_total, is_billed, date')
        .eq('tenant_id', tenantId);
      allTimeEntries = fallback.data ?? [];
      timeEntriesError = fallback.error;
    }
    
    if (timeEntriesError) {
      console.error('❌ Error fetching time entries:', timeEntriesError);
    }
    
    console.log('📊 Time entries fetched:', {
      count: allTimeEntries?.length || 0,
      sample: allTimeEntries?.slice(0, 3).map(te => ({
        hours: te.hours_total,
        is_billed: te.is_billed,
        date: te.date,
      })),
    });
    
    // Total hours (all time)
    const totalHours = (allTimeEntries || []).reduce((sum, te) => {
      const hours = Number(te.hours_total || 0);
      return sum + hours;
    }, 0);
    
    // Unbilled hours (all time, not just period)
    const unbilledHours = (allTimeEntries || []).filter(te => !te.is_billed)
      .reduce((sum, te) => {
        const hours = Number(te.hours_total || 0);
        return sum + hours;
      }, 0);
    
    console.log('📊 Calculated hours:', {
      totalHours,
      unbilledHours,
      totalEntries: allTimeEntries?.length || 0,
      sampleEntries: allTimeEntries?.slice(0, 5).map(te => ({
        hours: te.hours_total,
        date: te.date,
        is_billed: te.is_billed,
      })),
    });
    
    // Verify we actually have data
    if (allTimeEntries && allTimeEntries.length > 0 && totalHours === 0) {
      console.warn('⚠️ WARNING: Time entries exist but totalHours is 0!', {
        entries: allTimeEntries.map(te => ({
          hours_total: te.hours_total,
          hours_type: typeof te.hours_total,
          hours_value: Number(te.hours_total),
        })),
      });
    }
    
    // Fetch invoices directly
    const { data: invoicesData } = await adminPublic
      .from('invoices')
      .select('amount, status, issue_date')
      .eq('tenant_id', tenantId)
      .gte('issue_date', startDate.toISOString().slice(0, 10));
    
    const revenue = (invoicesData || []).filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    
    const unpaidInvoices = (invoicesData || []).filter(inv => 
      inv.status === 'sent' || inv.status === 'draft'
    );
    
    const unpaidCount = unpaidInvoices.length;
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => 
      sum + Number(inv.amount || 0), 0
    );
    
    // Fetch employees
    const { data: employeesData } = await adminPublic
      .from('employees')
      .select('id')
      .eq('tenant_id', tenantId);
    
    const stats = {
      projects: { active: activeProjects, totalBudgetedHours },
      time: { hoursTotal: totalHours, unbilledHours },
      invoices: { revenue, unpaidCount, unpaidAmount },
      employees: { total: employeesData?.length || 0 },
    };
    
    console.log('📊 Final stats:', {
      activeProjects,
      totalBudgetedHours,
      totalHours,
      unbilledHours,
      revenue,
      unpaidCount,
      employees: employeesData?.length || 0,
    });

    // Calculate KPIs from stats (use already calculated values)
    const projects = stats?.projects || {};
    const time = stats?.time || {};
    const invoices = stats?.invoices || {};
    const employees = stats?.employees || {};

    // Use already calculated values instead of re-extracting
    const avgRate = 600; // Default rate, could be calculated from projects
    const totalCost = totalHours * avgRate;
    const budgetVariance = totalBudgetedHours > 0
      ? ((totalHours / totalBudgetedHours) - 1) * 100
      : 0;

    // Get project performance with actual hours
    const { data: projectsForPerformance, error: projectsError } = await adminPublic
      .from('projects')
      .select('id, name, status, budgeted_hours, base_rate_sek')
      .eq('tenant_id', tenantId)
      .limit(10);

    // Fetch actual hours for each project
    const projectPerformance = await Promise.all(
      (projectsForPerformance || []).map(async (project) => {
        const { data: timeEntries } = await adminApp
          .from('time_entries')
          .select('hours_total')
          .eq('tenant_id', tenantId)
          .eq('project_id', project.id);
        
        const projectHours = (timeEntries || []).reduce((sum, te) => 
          sum + Number(te.hours_total || 0), 0
        );
        const plannedHours = Number(project.budgeted_hours || 0);
        const spi = plannedHours > 0 ? projectHours / plannedHours : 0;

        return {
          projectId: project.id,
          name: project.name || 'Unnamed',
          spi: Math.round(spi * 100) / 100,
          status: project.status || 'active',
        };
      })
    );

    const responseData = {
      summary: {
        activeProjects: projects.active || 0,
        totalEmployees: employees.total || 0,
        totalHours: Math.round(totalHours * 100) / 100,
        totalRevenue: Math.round(Number(invoices.revenue || 0) * 100) / 100,
        unpaidInvoices: invoices.unpaidCount || 0,
        unpaidAmount: Math.round(Number(invoices.unpaidAmount || 0) * 100) / 100,
      },
      kpis: {
        budgetVariance: Math.round(budgetVariance * 100) / 100,
        utilization: totalBudgetedHours > 0 
          ? Math.round((totalHours / totalBudgetedHours) * 100) / 100 
          : 0,
        unbilledHours: Math.round(Number(time.unbilledHours || 0) * 100) / 100,
      },
      projectPerformance: projectPerformance,
      period,
    };
    
    console.log('📊 Returning analytics data:', {
      totalHours: responseData.summary.totalHours,
      activeProjects: responseData.summary.activeProjects,
      totalEmployees: responseData.summary.totalEmployees,
      projectPerformanceCount: responseData.projectPerformance.length,
      timeEntriesCount: allTimeEntries?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analytics failed' },
      { status: 500 }
    );
  }
}

