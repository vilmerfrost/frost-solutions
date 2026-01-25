'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Validate Stripe key at module level
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error('[CheckoutForm] Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface CheckoutFormProps {
  userEmail: string;
  userId: string;
}

function CheckoutFormInner({ userEmail, userId }: { userEmail: string; userId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe har inte laddats ännu. Vänligen försök igen.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Submit elements for validation
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        throw new Error(submitError.message || 'Validering misslyckades');
      }

      // 2. Create subscription on server
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Okänt fel' }));
        throw new Error(errorData.error || `Serverfel: ${response.status}`);
      }

      const data = await response.json();

      if (!data.clientSecret) {
        throw new Error('Ingen client secret returnerades från servern');
      }

      // 3. Confirm payment with Stripe
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment_success=true`,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Betalningen misslyckades');
      }
      
      // If no error, Stripe redirects automatically
      
    } catch (err: any) {
      console.error('[CheckoutForm] Payment error:', err);
      setError(err.message || 'Ett oväntat fel inträffade. Försök igen.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Behandlar...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Betala 499 kr/månad
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-600">
        Genom att slutföra köpet accepterar du våra{' '}
        <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
          användarvillkor
        </Link>
      </p>

      <p className="text-center text-sm text-gray-500">
        Du kan avsluta prenumerationen när som helst
      </p>
    </form>
  );
}

export default function CheckoutForm({ userEmail, userId }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create SetupIntent on mount
    async function createSetupIntent() {
      try {
        const response = await fetch('/api/stripe/create-setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userEmail }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Okänt fel' }));
          throw new Error(errorData.error || 'Kunde inte skapa betalningsmetod');
        }

        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error('Ingen client secret returnerades');
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('[CheckoutForm] Setup error:', err);
        setSetupError(err.message || 'Kunde inte ladda betalningsformulär. Försök igen.');
      } finally {
        setIsLoading(false);
      }
    }

    createSetupIntent();
  }, [userId, userEmail]);

  if (setupError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Ett fel uppstod
        </h3>
        <p className="text-sm text-red-800 mb-4">
          {setupError}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Försök igen
        </button>
      </div>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">
          Laddar betalningsformulär...
        </p>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Stripe är inte konfigurerat
        </h3>
        <p className="text-sm text-red-800">
          Betalningar är tillfälligt otillgängliga. Kontakta support.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
          rules: {
            '.Input': {
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              boxShadow: 'none',
              padding: '12px',
            },
            '.Input:focus': {
              border: '2px solid #2563eb',
              boxShadow: '0 0 0 1px #2563eb',
            },
            '.Label': {
              fontWeight: '500',
              marginBottom: '8px',
            },
            '.Tab': {
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            },
            '.Tab--selected': {
              backgroundColor: '#eff6ff',
              border: '2px solid #2563eb',
            },
          },
        },
        locale: 'sv',
      }}
    >
      <CheckoutFormInner userEmail={userEmail} userId={userId} />
    </Elements>
  );
}
