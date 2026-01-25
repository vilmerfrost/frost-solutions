// app/checkout/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import CheckoutHeader from './components/CheckoutHeader';
import PlanCard from './components/PlanCard';
import PaymentForm from './components/PaymentForm';
import CheckoutFooter from './components/CheckoutFooter';

export default async function CheckoutPage() {
  // CRITICAL: Validate environment variables
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error('[Checkout] Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    redirect('/dashboard?error=checkout_unavailable');
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
    console.error('[Checkout] Missing NEXT_PUBLIC_STRIPE_PRICE_ID');
    redirect('/dashboard?error=checkout_unavailable');
  }

  const supabase = await createClient();
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    redirect('/login?redirect=/checkout');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_status, stripe_subscription_id, full_name')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error('[Checkout] Error fetching profile:', profileError);
  }

  // Check if already subscribed
  if (profile?.subscription_status === 'active') {
    redirect('/dashboard?already_subscribed=true');
  }

  // Plan configuration
  const planConfig = {
    companyName: 'Frost Solutions',
    planName: 'Pro Plan',
    price: 499,
    currency: 'kr',
    period: 'month',
    description: 'Everything you need to manage your construction business efficiently.',
    features: [
      { text: 'Unlimited time tracking' },
      { text: 'AI invoicing & packing slips' },
      { text: 'Fortnox & Visma integration' },
      { text: 'Unlimited team members' },
      { text: 'Priority support' },
    ],
    additionalInfo: [
      'No commitment',
      'Cancel anytime',
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <CheckoutHeader
          title="Upgrade to"
          highlight="Pro"
          subtitle="Get access to all features and take your business to the next level."
        />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Plan Card */}
          <div className="order-2 lg:order-1">
            <PlanCard {...planConfig} />
          </div>

          {/* Right: Payment Form */}
          <div className="order-1 lg:order-2">
            <PaymentForm
              price={planConfig.price}
              currency={planConfig.currency}
              period={planConfig.period}
              userEmail={session.user.email || ''}
              userId={session.user.id}
            />
          </div>
        </div>

        <CheckoutFooter />
      </div>
    </div>
  );
}
