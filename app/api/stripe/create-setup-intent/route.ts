// app/api/stripe/create-setup-intent/route.ts
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
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe är inte konfigurerat' },
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

    // Check if user already has a Stripe customer
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create or retrieve customer
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

    // Create SetupIntent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        user_id: userId,
        tenant_id: userId,
      },
    });

    console.log('[SetupIntent] Created:', {
      setupIntentId: setupIntent.id,
      customerId,
      userId,
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    });
  } catch (error: any) {
    console.error('[SetupIntent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Kunde inte initiera betalning' },
      { status: 500 }
    );
  }
}
