// app/api/stripe/create-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';

// Define expanded invoice type (payment_intent is added via expand)
interface ExpandedInvoice extends Stripe.Invoice {
  payment_intent?: string | Stripe.PaymentIntent | null;
}

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
        { error: 'Stripe är inte konfigurerat' },
        { status: 503 }
      );
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe Price ID är inte konfigurerat' },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const body = await req.json();
    const { userId, userEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Användar-ID och e-post krävs' },
        { status: 400 }
      );
    }

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
    // Since we expanded 'latest_invoice.payment_intent', payment_intent is an object
    const invoice = subscription.latest_invoice as ExpandedInvoice;
    
    // Handle expanded payment_intent (when using expand) or string ID
    let paymentIntent: Stripe.PaymentIntent | null = null;
    
    if (invoice.payment_intent) {
      if (typeof invoice.payment_intent === 'string') {
        // If it's a string ID, fetch the PaymentIntent
        paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
      } else {
        // If it's already expanded (from expand parameter), use it directly
        paymentIntent = invoice.payment_intent as unknown as Stripe.PaymentIntent;
      }
    }

    if (!paymentIntent?.client_secret) {
      throw new Error('Kunde inte hämta betalningsinformation');
    }

    // Update profile with subscription info (status will be updated by webhook)
    await admin
      .from('profiles')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: 'incomplete',
      })
      .eq('id', userId);

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
    console.error('[Subscription] Error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message || 'Kortet nekades' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Kunde inte skapa prenumeration' },
      { status: 500 }
    );
  }
}
