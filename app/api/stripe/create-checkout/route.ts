// app/api/stripe/create-checkout/route.ts
// Creates Stripe checkout session for subscription with 30-day trial
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

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
    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stripe är inte konfigurerat. Kontakta administratören.' },
        { status: 503 }
      );
    }

    const stripe = getStripe();

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Ej inloggad' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      priceId, 
      successUrl, 
      cancelUrl,
      collectPaymentMethod = true, // Collect card but don't charge during trial
    } = body;

    // Use price ID from env if not provided
    const stripePriceId = priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    
    if (!stripePriceId) {
      return NextResponse.json(
        { success: false, error: 'Stripe Price ID saknas. Konfigurera NEXT_PUBLIC_STRIPE_PRICE_ID.' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const admin = createAdminClient();
    
    // Check if user already has a Stripe customer ID
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .maybeSingle();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name || undefined,
        metadata: {
          user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to profile
      await admin
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Determine URLs - use environment variables for production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || req.nextUrl.origin;
    const finalSuccessUrl = successUrl || `${baseUrl}/settings/subscription?success=true`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/settings/subscription?canceled=true`;

    // Create checkout session with 30-day trial
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          user_id: user.id,
        },
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        user_id: user.id,
      },
      // Collect payment method but don't charge during trial
      payment_method_collection: collectPaymentMethod ? 'always' : 'if_required',
      // Allow promotion codes
      allow_promotion_codes: true,
      // Locale
      locale: 'sv',
      // Billing address collection
      billing_address_collection: 'auto',
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('[Stripe Checkout] Session created:', {
      id: session.id,
      customerId: stripeCustomerId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      },
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] Error:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { success: false, error: `Stripe-fel: ${error.message}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Kunde inte skapa checkout-session' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve checkout session status
export async function GET(req: NextRequest) {
  try {
    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stripe är inte konfigurerat' },
        { status: 503 }
      );
    }

    const stripe = getStripe();

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID saknas' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        subscriptionId: session.subscription,
      },
    });
  } catch (error: any) {
    console.error('[Stripe Checkout] Error retrieving session:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
