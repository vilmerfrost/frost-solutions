import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2025-12-15.clover' });
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

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: 'STRIPE_PRICE_ID is not configured' },
        { status: 503 }
      );
    }

    const admin = createAdminClient();

    const { data: tenant } = await admin
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id, trial_end')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // Trial abuse check: if tenant already had a trial, skip trial
    const hasUsedTrial = existingSub?.trial_end !== null && existingSub?.trial_end !== undefined;

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

      await admin
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('tenant_id', tenantId);
    }

    const baseUrl = `${req.nextUrl.origin}/app`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings/subscription?canceled=true`,
      metadata: {
        tenant_id: tenantId,
      },
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
        },
        ...(hasUsedTrial ? {} : { trial_period_days: 14 }),
      },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
      locale: 'sv',
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

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
