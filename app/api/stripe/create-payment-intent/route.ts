// app/api/stripe/create-payment-intent/route.ts
// Creates Stripe payment intent for AI credit top-up
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export const runtime = 'nodejs';

// Default amounts in SEK (öre)
const TOPUP_OPTIONS = [
  { amount: 2000, label: '20 kr (10 skanningar)', scans: 10 },
  { amount: 5000, label: '50 kr (25 skanningar)', scans: 25 },
  { amount: 10000, label: '100 kr (50 skanningar)', scans: 50 },
  { amount: 20000, label: '200 kr (100 skanningar)', scans: 100 },
];

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Ej inloggad' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount } = body; // Amount in öre (e.g., 2000 = 20 SEK)

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 200) {
      return NextResponse.json(
        { success: false, error: 'Ogiltigt belopp (minst 2 kr)' },
        { status: 400 }
      );
    }

    // Get tenant info for Stripe metadata
    const admin = createAdminClient();
    const { data: tenant } = await admin
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .maybeSingle();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in öre
      currency: 'sek',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        tenant_id: tenantId,
        user_id: user.id,
        tenant_name: tenant?.name || 'Unknown',
        type: 'ai_credits_topup',
        amount_sek: (amount / 100).toFixed(2),
      },
      description: `AI-krediter för ${tenant?.name || 'Frost Solutions'}`,
    });

    console.log('[Stripe] Payment intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (error: any) {
    console.error('[Stripe] Create payment intent error:', error);
    
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: extractErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Get available top-up options
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      options: TOPUP_OPTIONS,
      currency: 'SEK',
      pricePerScan: 200, // 2 SEK in öre
    },
  });
}

