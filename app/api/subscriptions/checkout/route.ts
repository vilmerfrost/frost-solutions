// app/api/subscriptions/checkout/route.ts
// Create Stripe checkout session for subscription
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, {
    apiVersion: '2025-12-15.clover',
  });
}

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stripe är inte konfigurerat' },
        { status: 503 }
      );
    }

    const stripe = getStripe();

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
    const { planId, billingCycle = 'monthly', skipTrial = false } = body;

    // planId is optional - use default Pro plan if not provided
    const effectivePlanId = planId || 'pro';

    const admin = createAdminClient();

    // Get plan - try by id first, then by name
    let plan = null;
    let planError = null;
    
    const { data: planById, error: planByIdError } = await admin
      .from('subscription_plans')
      .select('*')
      .eq('id', effectivePlanId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (planById) {
      plan = planById;
    } else {
      // Try by name (e.g., 'pro')
      const { data: planByName, error: planByNameError } = await admin
        .from('subscription_plans')
        .select('*')
        .eq('name', effectivePlanId)
        .eq('is_active', true)
        .maybeSingle();
      
      plan = planByName;
      planError = planByNameError;
    }

    if (planError || !plan) {
      // Use default values if no plan found in DB
      plan = {
        id: 'pro',
        name: 'pro',
        display_name: 'Frost Bygg Pro',
        description: 'Komplett byggplattform för små och medelstora företag',
        price_monthly_sek: 499,
        price_yearly_sek: 4990,
        stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || null,
        stripe_price_id_yearly: null,
      };
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
    // Use environment variable for production URL, with request origin as fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || req.nextUrl.origin;
    
    // Configure session based on whether to skip trial
    const trialDays = skipTrial ? undefined : 30; // 30-day free trial
    
    let sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      // Don't require payment method during trial - only collect if skipping trial
      payment_method_collection: skipTrial ? 'always' : 'if_required',
      success_url: skipTrial 
        ? `${baseUrl}/settings/subscription?payment_success=true&session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}/dashboard?trial_started=true`,
      cancel_url: skipTrial 
        ? `${baseUrl}/payment-required`
        : `${baseUrl}/settings/subscription?canceled=true`,
      metadata: {
        tenant_id: tenantId,
        plan_id: plan.id,
        plan_name: plan.name,
        billing_cycle: billingCycle,
        skip_trial: skipTrial ? 'true' : 'false',
      },
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
          plan_id: plan.id,
        },
        ...(trialDays ? { trial_period_days: trialDays } : {}),
      },
      billing_address_collection: 'auto',
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

