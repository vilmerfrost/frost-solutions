import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params;

    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No tenant found' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch project
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, name, budgeted_hours, base_rate_sek, status')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch time entries
    const { data: timeEntries, error: timeEntriesError } = await admin
      .from('time_entries')
      .select('hours_total, date, is_billed')
      .eq('project_id', projectId)
      .eq('tenant_id', tenantId);

    if (timeEntriesError) {
      console.error('❌ Time entries error:', timeEntriesError);
    }

    const actualHours = (timeEntries || []).reduce(
      (sum, te) => {
        const hours = Number(te.hours_total ?? 0);
        return sum + hours;
      },
      0
    );
    const rate = Number(project.base_rate_sek || 0);
    const plannedHours = Number(project.budgeted_hours || 0);
    const actualCost = actualHours * rate;
    const plannedValue = plannedHours * rate;

    if (process.env.NODE_ENV !== 'production') {
      console.info('📊 Project analytics', {
        projectId,
        plannedHours,
        actualHours,
        timeEntriesCount: timeEntries?.length ?? 0,
      })
    }

    // Calculate KPIs
    const spi = plannedHours > 0 ? actualHours / plannedHours : 0; // Schedule Performance Index
    const cpi = actualCost > 0 ? plannedValue / actualCost : 0; // Cost Performance Index (simplified)
    const budgetVariance = plannedValue > 0 
      ? ((actualCost - plannedValue) / plannedValue) * 100 
      : 0;

    // Fetch invoices for this project
    const { data: invoices, error: invoicesError } = await admin
      .from('invoices')
      .select('amount, status')
      .eq('project_id', projectId)
      .eq('tenant_id', tenantId);

    if (invoicesError) {
      console.error('Invoices error:', invoicesError);
    }

    const revenue = (invoices || [])
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const profitability = revenue > 0 
      ? ((revenue - actualCost) / revenue) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
        },
        metrics: {
          actualHours: Math.round(actualHours * 100) / 100,
          plannedHours: Math.round(plannedHours * 100) / 100,
          actualCost: Math.round(actualCost * 100) / 100,
          plannedValue: Math.round(plannedValue * 100) / 100,
          revenue: Math.round(revenue * 100) / 100,
        },
        kpis: {
          spi: Math.round(spi * 100) / 100,
          cpi: Math.round(cpi * 100) / 100,
          budgetVariance: Math.round(budgetVariance * 100) / 100,
          profitability: Math.round(profitability * 100) / 100,
        },
        status: {
          onSchedule: spi >= 0.95,
          onBudget: budgetVariance >= -5, // Within 5% of budget
          profitable: profitability > 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Project analytics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analytics failed' },
      { status: 500 }
    );
  }
}

