// app/api/subscriptions/current/route.ts
// Get current tenant subscription
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
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

    const admin = createAdminClient();

    // Get or create subscription
    const { data: subscription, error } = await admin.rpc(
      'get_or_create_subscription',
      { p_tenant_id: tenantId }
    );

    if (error) throw error;

    // Get plan details
    const { data: plan } = await admin
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    // Get recent invoices
    const { data: invoices } = await admin
      .from('subscription_invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        plan,
        invoices: invoices ?? [],
        isActive: ['active', 'trialing'].includes(subscription.status),
        isTrialing: subscription.status === 'trialing',
        daysRemaining: subscription.trial_end
          ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
      },
    });
  } catch (error: any) {
    console.error('[Current Subscription] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}

