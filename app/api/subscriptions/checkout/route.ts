// app/api/subscriptions/checkout/route.ts
// Create Stripe checkout session for subscription
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { planId, billingCycle = 'monthly' } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Get plan
    const { data: plan, error: planError } = await admin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get tenant info
    const { data: tenant } = await admin
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    // Get existing subscription
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // Get or create Stripe customer
    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: tenant?.name || user.email,
        metadata: {
          tenant_id: tenantId,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update subscription record with customer ID
      await admin
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('tenant_id', tenantId);
    }

    // Get Stripe price ID
    const priceId = billingCycle === 'yearly'
      ? plan.stripe_price_id_yearly
      : plan.stripe_price_id_monthly;

    // If no Stripe price configured, create dynamic checkout
    const baseUrl = req.nextUrl.origin;
    
    let sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      success_url: `${baseUrl}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings/subscription?canceled=true`,
      metadata: {
        tenant_id: tenantId,
        plan_id: planId,
        plan_name: plan.name,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
          plan_id: planId,
        },
        trial_period_days: 14, // 14-day trial
      },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
    };

    if (priceId) {
      sessionParams.line_items = [{ price: priceId, quantity: 1 }];
    } else {
      // Dynamic price (if Stripe prices not configured)
      const amount = billingCycle === 'yearly'
        ? Math.round((plan.price_yearly_sek || plan.price_monthly_sek * 10) * 100)
        : Math.round(plan.price_monthly_sek * 100);

      sessionParams.line_items = [{
        price_data: {
          currency: 'sek',
          product_data: {
            name: `Frost Solutions ${plan.display_name}`,
            description: plan.description || undefined,
          },
          unit_amount: amount,
          recurring: {
            interval: billingCycle === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('[Checkout] Session created:', {
      sessionId: session.id,
      tenantId,
      planName: plan.name,
      billingCycle,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error: any) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}

