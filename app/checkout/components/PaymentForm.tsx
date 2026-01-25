'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Validate Stripe key at module level
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error('[PaymentForm] Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface PaymentFormProps {
  price: number;
  currency: string;
  period: string;
  userEmail: string;
  userId: string;
}

function PaymentFormInner({ price, currency, period, userEmail, userId }: PaymentFormProps) {
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
      
    } catch (err: any) {
      console.error('[PaymentForm] Payment error:', err);
      setError(err.message || 'Ett oväntat fel inträffade. Försök igen.');
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">Payment details</h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="mt-2 h-12 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg transition-all hover:opacity-90 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay {price} {currency}/{period}
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500">
          By completing this purchase you accept our{' '}
          <Link href="/terms" className="text-blue-600 underline-offset-4 hover:underline">
            terms of service
          </Link>
        </p>

        <p className="text-center text-xs text-gray-500">
          Cancel anytime • No commitment
        </p>
      </form>
    </div>
  );
}

export default function PaymentForm({ price, currency, period, userEmail, userId }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        console.error('[PaymentForm] Setup error:', err);
        setSetupError(err.message || 'Kunde inte ladda betalningsformulär. Försök igen.');
      } finally {
        setIsLoading(false);
      }
    }

    createSetupIntent();
  }, [userId, userEmail]);

  if (setupError) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">Payment details</h3>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <h4 className="text-lg font-semibold text-red-900 mb-2">
            Ett fel uppstod
          </h4>
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
      </div>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">Payment details</h3>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">
            Loading payment form...
          </p>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">Payment details</h3>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <h4 className="text-lg font-semibold text-red-900 mb-2">
            Stripe is not configured
          </h4>
          <p className="text-sm text-red-800">
            Payments are temporarily unavailable. Please contact support.
          </p>
        </div>
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
            colorBackground: '#f9fafb',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
          rules: {
            '.Input': {
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: 'none',
              padding: '12px',
            },
            '.Input:focus': {
              border: '2px solid #2563eb',
              boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.1)',
            },
            '.Label': {
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151',
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
        locale: 'en',
      }}
    >
      <PaymentFormInner 
        price={price} 
        currency={currency} 
        period={period}
        userEmail={userEmail}
        userId={userId}
      />
    </Elements>
  );
}
