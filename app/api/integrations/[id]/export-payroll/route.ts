// app/api/integrations/[id]/export-payroll/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: integrationId } = await params;
    const tenantId = await getTenantId();
    const admin = createAdminClient();
    const body = await req.json();
    const { month } = body; // Format: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Ogiltigt månadsformat. Använd YYYY-MM.' }, { status: 400 });
    }

    // Create export job for payroll
    const { error } = await admin.from('integration_jobs').insert({
      tenant_id: tenantId,
      integration_id: integrationId,
      job_type: 'export_payroll',
      payload: { month },
      status: 'queued'
    });

    if (error) {
      return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Lönespec för ${month} har köats för export` 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Okänt fel' }, { status: 500 });
  }
}

