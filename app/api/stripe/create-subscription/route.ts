// app/api/stripe/create-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

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
    // Validate Stripe config
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[create-subscription] Missing STRIPE_SECRET_KEY');
      return NextResponse.json(
        { error: 'Stripe är inte konfigurerat korrekt' },
        { status: 503 }
      );
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) {
      console.error('[create-subscription] Missing NEXT_PUBLIC_STRIPE_PRICE_ID');
      return NextResponse.json(
        { error: 'Price ID saknas i konfigurationen' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { error: 'Ogiltig request body' },
        { status: 400 }
      );
    }

    const { userId, userEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'userId och userEmail krävs' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const admin = createAdminClient();

    // Get or create customer
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Check if customer exists by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            user_id: userId,
            tenant_id: userId,
          },
        });
        customerId = customer.id;
      }

      // Update profile with customer ID
      await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create the subscription with incomplete status
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: userId,
        tenant_id: userId,
      },
    });

    // Get the client secret from the payment intent
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent?.client_secret) {
      throw new Error('Kunde inte hämta betalningsinformation');
    }

    // Update profile with subscription info (status will be updated by webhook)
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: 'incomplete',
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[create-subscription] Database update error:', updateError);
      // Don't fail the request, subscription was created
    }

    console.log('[Subscription] Created:', {
      subscriptionId: subscription.id,
      customerId,
      userId,
      status: subscription.status,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('[create-subscription] Error:', error);
    
    // Return user-friendly error based on error type
    let userMessage = 'Ett fel uppstod vid skapande av prenumeration';
    
    if (error.type === 'StripeInvalidRequestError') {
      userMessage = 'Ogiltig prenumerationsinformation';
    } else if (error.type === 'StripeCardError') {
      userMessage = error.message || 'Kortbetalningen misslyckades';
    } else if (error.message) {
      userMessage = error.message;
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
