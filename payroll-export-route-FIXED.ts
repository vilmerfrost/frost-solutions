// app/api/payroll/periods/[id]/export/route.ts
// ✅ FIXED: Improved error handling and validation
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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[POST /api/payroll/periods/[id]/export] 🚀 STARTING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const { id } = await params;
    console.log('[POST /api/payroll/periods/[id]/export] Period ID:', id);
    
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[POST /api/payroll/periods/[id]/export] ❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    console.log('[POST /api/payroll/periods/[id]/export] User:', user.id);

    // Check user role
    const adminClient = createAdminClient();
    const { data: employee, error: empError } = await adminClient
      .from('employees')
      .select('role, tenant_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (empError) {
      console.error('[POST /api/payroll/periods/[id]/export] ❌ Employee lookup error:', empError);
      return NextResponse.json(
        { success: false, error: 'Kunde inte verifiera användarroll' },
        { status: 500 }
      );
    }

    if (!employee) {
      console.error('[POST /api/payroll/periods/[id]/export] ❌ Employee not found');
      return NextResponse.json(
        { success: false, error: 'Anställd saknas' },
        { status: 403 }
      );
    }

    const role = (employee?.role || '').toLowerCase();
    if (role !== 'admin') {
      console.error('[POST /api/payroll/periods/[id]/export] ❌ Insufficient permissions:', role);
      return NextResponse.json(
        { success: false, error: 'Endast administratörer kan exportera löneperioder' },
        { status: 403 }
      );
    }

    // Verify period exists and belongs to tenant
    const { data: period, error: periodError } = await adminClient
      .from('payroll_periods')
      .select('id, tenant_id, status, start_date, end_date, export_format')
      .eq('id', id)
      .eq('tenant_id', employee.tenant_id)
      .maybeSingle();

    if (periodError) {
      console.error('[POST /api/payroll/periods/[id]/export] ❌ Period lookup error:', periodError);
      return NextResponse.json(
        { success: false, error: 'Kunde inte hämta löneperiod' },
        { status: 500 }
      );
    }

    if (!period) {
      console.error('[POST /api/payroll/periods/[id]/export] ❌ Period not found');
      return NextResponse.json(
        { success: false, error: 'Löneperiod saknas eller tillhör inte din organisation' },
        { status: 404 }
      );
    }

    console.log('[POST /api/payroll/periods/[id]/export] Period status:', period.status);

    // Export the period
    console.log('[POST /api/payroll/periods/[id]/export] Starting export...');
    const res = await exportPeriod(id, user.id);
    
    console.log('[POST /api/payroll/periods/[id]/export] ✅ Export completed:', {
      hasDownloadUrl: !!res.downloadUrl,
      warnings: res.warnings?.length || 0,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return NextResponse.json({ 
      success: true, 
      data: res, 
      warnings: res.warnings ?? [] 
    });
  } catch (e: any) {
    console.error('[POST /api/payroll/periods/[id]/export] ❌ FATAL ERROR:', {
      message: e.message,
      stack: e.stack,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return NextResponse.json(
      { 
        success: false, 
        error: extractErrorMessage(e),
        details: process.env.NODE_ENV === 'development' ? e.message : undefined,
      }, 
      { status: 500 }
    );
  }
}

