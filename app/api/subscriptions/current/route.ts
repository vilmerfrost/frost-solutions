// app/api/subscriptions/current/route.ts
// Get current tenant subscription with grace period support
import { NextResponse } from 'next/server';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Grace period duration in days
const GRACE_PERIOD_DAYS = 5;

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

    // Calculate trial days remaining
    const trialDaysRemaining = subscription.trial_end
      ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    // Calculate grace period for past_due subscriptions
    let gracePeriodEnd: string | null = null;
    let graceDaysRemaining: number | null = null;
    let isInGracePeriod = false;

    if (subscription.status === 'past_due') {
      // Grace period starts when status changed to past_due
      // If we have a past_due_since field, use that; otherwise use updated_at
      const pastDueSince = subscription.past_due_since || subscription.updated_at;
      
      if (pastDueSince) {
        const pastDueDate = new Date(pastDueSince);
        gracePeriodEnd = new Date(pastDueDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();
        graceDaysRemaining = Math.max(0, Math.ceil((new Date(gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        isInGracePeriod = graceDaysRemaining > 0;
      }
    }

    // Determine if user should still have access
    // Access is allowed if: active, trialing (with days left), past_due (in grace period)
    const hasAccess = 
      subscription.status === 'active' ||
      (subscription.status === 'trialing' && (trialDaysRemaining === null || trialDaysRemaining > 0)) ||
      (subscription.status === 'past_due' && isInGracePeriod);

    // Determine if we should show limited access (trial expired or grace period expired)
    const isLimitedAccess = 
      (subscription.status === 'trialing' && trialDaysRemaining !== null && trialDaysRemaining <= 0) ||
      (subscription.status === 'past_due' && !isInGracePeriod) ||
      subscription.status === 'canceled' ||
      subscription.status === 'unpaid';

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          ...subscription,
          grace_period_end: gracePeriodEnd,
        },
        plan,
        invoices: invoices ?? [],
        // Status flags
        isActive: subscription.status === 'active',
        isTrialing: subscription.status === 'trialing',
        isPastDue: subscription.status === 'past_due',
        isCanceled: subscription.status === 'canceled',
        // Days remaining
        daysRemaining: trialDaysRemaining,
        graceDaysRemaining,
        // Access control
        hasAccess,
        isLimitedAccess,
        isInGracePeriod,
        // Warnings
        shouldShowTrialWarning: subscription.status === 'trialing' && trialDaysRemaining !== null && trialDaysRemaining <= 7,
        shouldShowPaymentWarning: subscription.status === 'past_due',
        shouldShowUpgradePrompt: isLimitedAccess,
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

