// app/api/stripe/webhook/route.ts
// Handles Stripe webhooks for payment confirmation
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/admin';
import { headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';

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

// Disable body parsing - we need raw body for signature verification
export const dynamic = 'force-dynamic';

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Stripe Webhook] Payment succeeded:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    metadata: paymentIntent.metadata,
  });

  const { tenant_id, type } = paymentIntent.metadata;

  if (type !== 'ai_credits_topup' || !tenant_id) {
    console.log('[Stripe Webhook] Not an AI credits payment, skipping');
    return;
  }

  const admin = createAdminClient();
  const amountSek = paymentIntent.amount / 100; // Convert öre to SEK

  // Add credits using RPC function
  const { data, error } = await admin.rpc('topup_ai_credits', {
    p_tenant_id: tenant_id,
    p_amount: amountSek,
    p_stripe_payment_intent_id: paymentIntent.id,
    p_stripe_charge_id: paymentIntent.latest_charge as string || null,
    p_metadata: {
      stripe_status: paymentIntent.status,
      payment_method: paymentIntent.payment_method,
      amount_received: paymentIntent.amount_received,
    },
  });

  if (error) {
    console.error('[Stripe Webhook] Failed to add credits:', error);
    Sentry.captureException(error, {
      tags: { component: 'stripe-webhook', action: 'add-credits' },
      extra: { tenantId: tenant_id, paymentIntentId: paymentIntent.id }
    });
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  console.log('[Stripe Webhook] Credits added successfully:', {
    tenantId: tenant_id,
    amountSek,
    newBalance: data?.[0]?.new_balance,
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown payment error';
  console.error('[Stripe Webhook] Payment failed:', {
    id: paymentIntent.id,
    error: errorMessage,
    metadata: paymentIntent.metadata,
  });
  
  Sentry.captureMessage('Stripe payment failed', {
    level: 'warning',
    tags: { component: 'stripe-webhook', action: 'payment-failed' },
    extra: { 
      paymentIntentId: paymentIntent.id, 
      error: errorMessage,
      tenantId: paymentIntent.metadata?.tenant_id 
    }
  });

  // Log failed payment attempt (optional)
  const { tenant_id } = paymentIntent.metadata;
  if (tenant_id) {
    const admin = createAdminClient();
    await admin.from('ai_transactions').insert({
      tenant_id,
      type: 'topup',
      amount: 0,
      feature: 'topup_failed',
      description: `Misslyckad betalning: ${paymentIntent.last_payment_error?.message || 'Okänt fel'}`,
      stripe_payment_intent_id: paymentIntent.id,
      metadata: {
        error: paymentIntent.last_payment_error,
        status: paymentIntent.status,
      },
    });
  }
}

// ============================================================================
// SUBSCRIPTION HANDLERS
// ============================================================================

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe Webhook] Checkout completed:', {
    id: session.id,
    subscription: session.subscription,
    customer: session.customer,
    metadata: session.metadata,
  });

  const { tenant_id, plan_id, plan_name, billing_cycle } = session.metadata || {};
  
  if (!tenant_id || !session.subscription) {
    console.log('[Stripe Webhook] Not a subscription checkout, skipping');
    return;
  }

  const admin = createAdminClient();

  // Update subscription record
  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'active',
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      billing_cycle: billing_cycle || 'monthly',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trial_end: null, // Trial ended when payment made
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenant_id);

  if (error) {
    console.error('[Stripe Webhook] Failed to update subscription:', error);
    Sentry.captureException(error, {
      tags: { component: 'stripe-webhook', action: 'checkout-completed' },
      extra: { tenantId: tenant_id, sessionId: session.id }
    });
    throw error;
  }

  // Log event
  await admin.from('subscription_events').insert({
    tenant_id,
    event_type: 'checkout_completed',
    stripe_event_id: session.id,
    data: {
      plan_name,
      billing_cycle,
      subscription_id: session.subscription,
    },
  });

  console.log('[Stripe Webhook] Subscription activated for tenant:', tenant_id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Subscription updated:', {
    id: subscription.id,
    status: subscription.status,
    metadata: subscription.metadata,
  });

  const { tenant_id } = subscription.metadata || {};
  if (!tenant_id) {
    console.log('[Stripe Webhook] No tenant_id in metadata, skipping');
    return;
  }

  const admin = createAdminClient();

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    paused: 'paused',
  };

  // Cast to any to handle Stripe API version differences
  const sub = subscription as any;
  const { error } = await admin
    .from('subscriptions')
    .update({
      status: statusMap[subscription.status] || subscription.status,
      current_period_start: sub.current_period_start 
        ? new Date(sub.current_period_start * 1000).toISOString() 
        : null,
      current_period_end: sub.current_period_end 
        ? new Date(sub.current_period_end * 1000).toISOString() 
        : null,
      cancel_at: sub.cancel_at 
        ? new Date(sub.cancel_at * 1000).toISOString() 
        : null,
      canceled_at: sub.canceled_at 
        ? new Date(sub.canceled_at * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Stripe Webhook] Failed to update subscription:', error);
  }

  // Log event
  await admin.from('subscription_events').insert({
    tenant_id,
    event_type: 'subscription_updated',
    stripe_event_id: subscription.id,
    data: {
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Subscription deleted:', {
    id: subscription.id,
    metadata: subscription.metadata,
  });

  const { tenant_id } = subscription.metadata || {};
  if (!tenant_id) return;

  const admin = createAdminClient();

  await admin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  await admin.from('subscription_events').insert({
    tenant_id,
    event_type: 'subscription_canceled',
    stripe_event_id: subscription.id,
    data: { canceled_at: new Date().toISOString() },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  console.log('[Stripe Webhook] Invoice paid:', {
    id: invoice.id,
    subscription: inv.subscription,
    amount_paid: invoice.amount_paid,
  });

  if (!inv.subscription) return;

  const admin = createAdminClient();

  // Get tenant from subscription
  const { data: sub } = await admin
    .from('subscriptions')
    .select('tenant_id')
    .eq('stripe_subscription_id', inv.subscription as string)
    .maybeSingle();

  if (!sub?.tenant_id) return;

  // Record invoice
  await admin.from('subscription_invoices').upsert({
    tenant_id: sub.tenant_id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: inv.payment_intent as string,
    amount_due: invoice.amount_due / 100,
    amount_paid: invoice.amount_paid / 100,
    currency: invoice.currency.toUpperCase(),
    status: 'paid',
    invoice_pdf_url: inv.invoice_pdf || null,
    hosted_invoice_url: inv.hosted_invoice_url || null,
    period_start: inv.period_start 
      ? new Date(inv.period_start * 1000).toISOString() 
      : null,
    period_end: inv.period_end 
      ? new Date(inv.period_end * 1000).toISOString() 
      : null,
    paid_at: new Date().toISOString(),
  }, {
    onConflict: 'stripe_invoice_id',
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  console.log('[Stripe Webhook] Invoice payment failed:', {
    id: invoice.id,
    subscription: inv.subscription,
  });

  if (!inv.subscription) return;

  const admin = createAdminClient();

  const { data: sub } = await admin
    .from('subscriptions')
    .select('tenant_id')
    .eq('stripe_subscription_id', inv.subscription as string)
    .maybeSingle();

  if (!sub?.tenant_id) return;

  await admin.from('subscription_events').insert({
    tenant_id: sub.tenant_id,
    event_type: 'payment_failed',
    stripe_event_id: invoice.id,
    data: {
      amount_due: invoice.amount_due / 100,
      attempt_count: inv.attempt_count,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[Stripe Webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('[Stripe Webhook] Event received:', {
      type: event.type,
      id: event.id,
    });

    // Handle specific event types
    switch (event.type) {
      // AI Credits - Payment Intents
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      // Subscriptions - Checkout
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // Subscriptions - Lifecycle
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // Subscriptions - Invoices
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'charge.succeeded':
        console.log('[Stripe Webhook] Charge succeeded:', (event.data.object as Stripe.Charge).id);
        break;

      case 'charge.refunded':
        console.log('[Stripe Webhook] Charge refunded:', (event.data.object as Stripe.Charge).id);
        break;

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    Sentry.captureException(error, {
      tags: { component: 'stripe-webhook' },
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

