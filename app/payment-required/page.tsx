// app/payment-required/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, CheckCircle2, Loader2, ArrowLeft, Shield, Zap } from 'lucide-react';
import FrostLogo from '@/components/FrostLogo';

export default function PaymentRequiredPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Call checkout API with skipTrial to require payment
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skipTrial: true, // Force payment collection
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte starta betalning');
      }
      
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Ingen checkout-URL returnerades');
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err.message || 'Något gick fel. Försök igen.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <FrostLogo size={48} />
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Din provperiod har slutat
            </h1>
            <p className="text-white/90 mt-2">
              Tack för att du testade Frost Bygg!
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Price Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    Frost Bygg Pro
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">499</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">kr/mån</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ingen bindningstid • Avsluta när som helst
              </p>
            </div>

            {/* Features List */}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-3">
                Allt du behöver ingår:
              </p>
              <ul className="space-y-3">
                {[
                  'Obegränsad tidrapportering',
                  'Automatiska OB-beräkningar',
                  'Projekthantering & budgetering',
                  'AI-driven faktura- & följesedelsläsning',
                  'ROT/RUT-avdrag',
                  'Fortnox & Visma-integration',
                  'Obegränsat antal användare',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Laddar...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Fortsätt med betalning
                </>
              )}
            </Button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Säkra betalningar via Stripe</span>
            </div>

            {/* Back/Logout Link */}
            <button
              onClick={handleLogout}
              className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Logga ut
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Frågor? Kontakta oss på{' '}
          <a href="mailto:support@frostbygg.se" className="text-blue-600 hover:underline">
            support@frostbygg.se
          </a>
        </p>
      </div>
    </div>
  );
}
