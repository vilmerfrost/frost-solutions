// app/checkout/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import CheckoutForm from './CheckoutForm';
import { CheckCircle2, Shield } from 'lucide-react';
import FrostLogo from '@/components/FrostLogo';

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
    // Continue anyway - profile might not exist yet
  }

  // Check if already subscribed
  if (profile?.subscription_status === 'active') {
    redirect('/dashboard?already_subscribed=true');
  }

  const features = [
    'Obegränsad tidrapportering',
    'AI-faktura & följesedelsläsning',
    'Fortnox & Visma integration',
    'Obegränsat antal användare',
    'Prioriterad support',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <FrostLogo size={36} />
          <a 
            href="/dashboard" 
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Tillbaka till dashboard
          </a>
        </div>
      </header>

      <main className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Uppgradera till <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pro</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Få tillgång till alla funktioner och ta ditt byggföretag till nästa nivå.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Features & Pricing */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Frost Bygg</p>
                      <h2 className="text-2xl font-bold">Pro Plan</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold">499</p>
                      <p className="text-blue-100 text-sm">kr/månad</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-6">
                    Allt du behöver för att hantera ditt byggföretag effektivt.
                  </p>

                  <ul className="space-y-4">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Ingen bindningstid</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Avsluta när som helst</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges - Desktop Only */}
              <div className="hidden lg:block bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span>Säker betalning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" rx="4" fill="#635BFF"/>
                      <path d="M12.5 7.5c-2.3 0-4.5 1.5-4.5 4.5s2.2 4.5 4.5 4.5c1.8 0 3.3-1 4-2.5h-2c-.5.7-1.2 1-2 1-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c.8 0 1.5.4 2 1h2c-.7-1.5-2.2-2.5-4-2.5z" fill="white"/>
                    </svg>
                    <span>Stripe</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Betalningsuppgifter
              </h3>
              
              <CheckoutForm 
                userEmail={session.user.email || ''} 
                userId={session.user.id}
              />
            </div>
          </div>

          {/* Mobile Trust Badges */}
          <div className="lg:hidden mt-6 bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Säker betalning</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="4" fill="#635BFF"/>
                  <path d="M12.5 7.5c-2.3 0-4.5 1.5-4.5 4.5s2.2 4.5 4.5 4.5c1.8 0 3.3-1 4-2.5h-2c-.5.7-1.2 1-2 1-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c.8 0 1.5.4 2 1h2c-.7-1.5-2.2-2.5-4-2.5z" fill="white"/>
                </svg>
                <span>Stripe</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-8">
            Genom att fortsätta godkänner du våra{' '}
            <a href="/terms" className="underline hover:text-gray-700">
              Användarvillkor
            </a>{' '}
            och{' '}
            <a href="/privacy" className="underline hover:text-gray-700">
              Integritetspolicy
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
