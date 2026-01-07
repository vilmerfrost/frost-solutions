// app/api/ai/balance/route.ts
// Get AI credit balance and transaction history for tenant
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const url = new URL(req.url);
    const includeTransactions = url.searchParams.get('transactions') === 'true';
    const limit = Math.min(100, Number(url.searchParams.get('limit') ?? 20));

    // Get or create credit balance
    const { data: credits, error: creditsError } = await admin.rpc(
      'get_or_create_ai_credits',
      { p_tenant_id: tenantId }
    );

    if (creditsError) {
      throw creditsError;
    }

    // Get pricing info
    const { data: pricing } = await admin
      .from('ai_pricing')
      .select('feature, price_sek, display_name')
      .eq('is_active', true);

    const response: any = {
      success: true,
      data: {
        balance: credits?.balance ?? 0,
        totalSpent: credits?.total_spent ?? 0,
        totalToppedUp: credits?.total_topped_up ?? 0,
        lastTopup: credits?.last_topup_at ?? null,
        pricing: pricing ?? [],
        pricePerScan: 2.00, // Default 2 SEK
      },
    };

    // Optionally include recent transactions
    if (includeTransactions) {
      const { data: transactions } = await admin
        .from('ai_transactions')
        .select('id, type, amount, feature, description, created_at, balance_after')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      response.data.transactions = transactions ?? [];
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[AI Balance] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}

