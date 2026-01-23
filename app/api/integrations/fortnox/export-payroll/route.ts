// app/api/integrations/fortnox/export-payroll/route.ts
// Direct Fortnox payroll export endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';
import { exportPayrollToFortnox } from '@/lib/integrations/fortnox/payroll-exporter';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Ej inloggad eller tenant saknas' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Ej inloggad' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { month } = body; // Format: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, error: 'Ogiltigt månadsformat. Använd YYYY-MM.' },
        { status: 400 }
      );
    }

    // Get Fortnox integration
    const admin = createAdminClient();
    const { data: integration, error: integrationError } = await admin
      .from('integrations')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('provider', 'fortnox')
      .eq('status', 'connected')
      .maybeSingle();

    if (integrationError || !integration) {
      return NextResponse.json(
        { success: false, error: 'Fortnox är inte anslutet. Gå till Integrationer och anslut först.' },
        { status: 400 }
      );
    }

    // Export payroll
    const result = await exportPayrollToFortnox(integration.id, tenantId, month);

    return NextResponse.json({
      success: result.success,
      exported: result.exported,
      errors: result.errors,
      warnings: result.warnings,
      message: result.success 
        ? `${result.exported} anställda exporterade till Fortnox för ${month}`
        : 'Export misslyckades',
    });

  } catch (error: any) {
    console.error('[Fortnox Export] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Exportfel' },
      { status: 500 }
    );
  }
}
