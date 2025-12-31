import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
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

    const admin = createAdminClient();

    // Verify project exists and belongs to tenant
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, name, base_rate_sek, client_id, customer_name')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch unbilled time entries for this project
    const { data: timeEntries, error: entriesError } = await admin
      .from('time_entries')
      .select('id, hours_total, date, start_time, end_time, description, employee_id, ob_type')
      .eq('project_id', projectId)
      .eq('is_billed', false)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (entriesError) {
      console.error('Error fetching unbilled hours:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch time entries', details: entriesError.message },
        { status: 500 }
      );
    }

    const totalHours = (timeEntries || []).reduce((sum, entry) => {
      return sum + Number(entry?.hours_total ?? 0);
    }, 0);

    const rate = Number(project.base_rate_sek) || 360;
    const totalAmount = totalHours * rate;

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          base_rate_sek: rate,
          client_id: project.client_id,
          customer_name: project.customer_name,
        },
        unbilledHours: totalHours,
        totalAmount: totalAmount,
        timeEntries: timeEntries || [],
        entryCount: timeEntries?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Error in unbilled-hours API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch unbilled hours',
        details: error.details || null,
      },
      { status: 500 }
    );
  }
}

