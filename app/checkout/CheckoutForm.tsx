'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

// Load Stripe outside of component to avoid recreating on each render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  userEmail: string;
  userId: string;
  userName: string;
}

function PaymentForm({ userEmail, userId }: { userEmail: string; userId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Formulärvalidering misslyckades');
        setLoading(false);
        return;
      }

      // Create subscription on the server
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte skapa prenumeration');
      }

      const { clientSecret, subscriptionId } = data;

      if (!clientSecret) {
        throw new Error('Ingen client secret returnerades');
      }

      // Confirm the payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment_success=true&subscription_id=${subscriptionId}`,
        },
      });

      if (confirmError) {
        // This will only happen if there's an immediate error
        // Otherwise, the user will be redirected
        setError(confirmError.message || 'Betalningen misslyckades');
        setLoading(false);
        return;
      }

      // Log acceptance of terms at checkout
      try {
        await fetch('/api/legal/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: 'terms',
            documentVersion: 'v1.0',
            acceptanceMethod: 'checkout',
          }),
        });
      } catch (acceptError) {
        // Logging acceptance is not critical - payment already succeeded
        console.warn('Could not log legal acceptance:', acceptError);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Ett fel uppstod. Försök igen.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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

      <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-4">
        Genom att slutföra köpet accepterar du våra{' '}
        <Link 
          href="/terms" 
          target="_blank"
          className="text-blue-600 hover:text-blue-700 underline dark:text-blue-400 dark:hover:text-blue-500"
        >
          användarvillkor
        </Link>
        {' '}och{' '}
        <Link 
          href="/privacy" 
          target="_blank"
          className="text-blue-600 hover:text-blue-700 underline dark:text-blue-400 dark:hover:text-blue-500"
        >
          integritetspolicy
        </Link>
      </p>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Du kan avsluta prenumerationen när som helst
      </p>
    </form>
  );
}

export default function CheckoutForm({ userEmail, userId, userName }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create SetupIntent when component mounts
    const createSetupIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userEmail }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Kunde inte initiera betalning');
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Setup intent error:', err);
        setError(err.message || 'Kunde inte ladda betalningsformuläret');
      } finally {
        setLoading(false);
      }
    };

    createSetupIntent();
  }, [userId, userEmail]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Laddar betalningsformulär...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
              >
                Försök igen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Kunde inte initiera betalning
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
      <PaymentForm userEmail={userEmail} userId={userId} />
    </Elements>
  );
}
