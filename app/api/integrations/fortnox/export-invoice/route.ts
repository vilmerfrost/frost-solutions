// app/api/integrations/fortnox/export-invoice/route.ts
// Export a single invoice to Fortnox
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';
import { exportInvoiceToFortnox } from '@/lib/integrations/fortnox/payroll-exporter';

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
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Faktura-ID saknas' },
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

    // Export invoice
    const result = await exportInvoiceToFortnox(integration.id, tenantId, invoiceId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        fortnoxId: result.fortnoxId,
        message: `Faktura exporterad till Fortnox (${result.fortnoxId})`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Fortnox Export Invoice] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Exportfel' },
      { status: 500 }
    );
  }
}
