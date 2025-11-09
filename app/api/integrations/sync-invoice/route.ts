// app/api/integrations/sync-invoice/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { AccountingSyncOrchestrator } from '@/lib/integrations/sync/AccountingSyncOrchestrator';
import { z } from 'zod';

const syncInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  provider: z.enum(['fortnox', 'visma']),
});

export async function POST(request: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[Sync Invoice API] 🚀 STARTING');

  try {
    // Get tenant ID
    const tenantId = await getTenantId();

    if (!tenantId) {
      console.error('[Sync Invoice API] ❌ No tenant ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Sync Invoice API] Tenant:', tenantId);

    // Parse and validate request body
    const body = await request.json();
    console.log('[Sync Invoice API] Request body:', body);

    const validation = syncInvoiceSchema.safeParse(body);

    if (!validation.success) {
      console.error('[Sync Invoice API] ❌ Validation failed:', validation.error);
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { invoiceId, provider } = validation.data;

    console.log('[Sync Invoice API] ✅ Request validated');

    // Sync invoice
    const orchestrator = new AccountingSyncOrchestrator();
    const result = await orchestrator.syncInvoiceToAccounting(
      tenantId,
      invoiceId,
      provider
    );

    if (!result.success) {
      console.error('[Sync Invoice API] ❌ Sync failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    console.log('[Sync Invoice API] ✅ SUCCESS');
    console.log('[Sync Invoice API] External ID:', result.externalId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      externalId: result.externalId,
    });
  } catch (error: any) {
    console.error('[Sync Invoice API] ❌ FATAL ERROR:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

