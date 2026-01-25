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
    // Handle both expanded and non-expanded cases
    let invoice: Stripe.Invoice & { payment_intent?: string | Stripe.PaymentIntent | null };
    let paymentIntent: Stripe.PaymentIntent | null = null;

    console.log('[create-subscription] Subscription created:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      latestInvoiceType: typeof subscription.latest_invoice,
      latestInvoiceId: typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id,
    });

    // Check if latest_invoice is a string ID (not expanded)
    if (typeof subscription.latest_invoice === 'string') {
      // Fetch invoice with payment_intent expanded
      invoice = await stripe.invoices.retrieve(subscription.latest_invoice, {
        expand: ['payment_intent'],
      }) as Stripe.Invoice & { payment_intent?: string | Stripe.PaymentIntent | null };
    } else {
      invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: string | Stripe.PaymentIntent | null };
    }

    console.log('[create-subscription] Invoice retrieved:', {
      invoiceId: invoice.id,
      invoiceStatus: invoice.status,
      paymentIntentType: typeof invoice.payment_intent,
      paymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id,
      hasPaymentIntent: !!invoice.payment_intent,
    });

    // Check if payment_intent is a string ID (not expanded)
    if (typeof invoice.payment_intent === 'string') {
      // Fetch payment intent separately
      paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
    } else if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
      paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    } else {
      // Log detailed error information
      console.error('[create-subscription] No payment_intent found:', {
        invoiceId: invoice.id,
        invoiceStatus: invoice.status,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        invoiceKeys: Object.keys(invoice),
        latestInvoiceType: typeof subscription.latest_invoice,
      });
      
      // Try to get the payment intent from the subscription's pending_setup_intent
      // Sometimes Stripe creates a setup intent instead for subscriptions
      if (subscription.pending_setup_intent) {
        console.log('[create-subscription] Found pending_setup_intent, trying to use it');
        const setupIntentId = typeof subscription.pending_setup_intent === 'string' 
          ? subscription.pending_setup_intent 
          : subscription.pending_setup_intent.id;
        
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        if (setupIntent.client_secret) {
          return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: setupIntent.client_secret,
            isSetupIntent: true,
          });
        }
      }
      
      // If invoice exists but no payment_intent, try to finalize and pay the invoice
      // This creates a payment_intent
      if (invoice.status === 'draft') {
        console.log('[create-subscription] Invoice is draft, attempting to finalize');
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
          expand: ['payment_intent'],
        });
        
        if (finalizedInvoice.payment_intent) {
          const piId = typeof finalizedInvoice.payment_intent === 'string'
            ? finalizedInvoice.payment_intent
            : finalizedInvoice.payment_intent.id;
          
          paymentIntent = await stripe.paymentIntents.retrieve(piId);
        }
      }
      
      if (!paymentIntent || !paymentIntent.client_secret) {
        throw new Error('Kunde inte hämta betalningsinformation från Stripe - ingen payment_intent hittades');
      }
    }

    if (!paymentIntent || !paymentIntent.client_secret) {
      console.error('[create-subscription] PaymentIntent missing client_secret:', {
        hasPaymentIntent: !!paymentIntent,
        hasClientSecret: !!paymentIntent?.client_secret,
        paymentIntentId: paymentIntent?.id,
        paymentIntentStatus: paymentIntent?.status,
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
      });
      throw new Error('Kunde inte hämta betalningsinformation från Stripe - client_secret saknas');
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
