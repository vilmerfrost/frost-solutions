// app/components/ai/PaymentModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useQueryClient } from '@tanstack/react-query';
import { X, CreditCard, Check, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { BASE_PATH } from '@/utils/url';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface TopUpOption {
  amount: number;
  label: string;
  scans: number;
}

const DEFAULT_OPTIONS: TopUpOption[] = [
  { amount: 2000, label: '20 kr', scans: 10 },
  { amount: 5000, label: '50 kr', scans: 25 },
  { amount: 10000, label: '100 kr', scans: 50 },
  { amount: 20000, label: '200 kr', scans: 100 },
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function PaymentForm({ 
  amount,
  onSuccess,
  onClose 
}: { 
  amount: number;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Include basePath since app runs under /app
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${BASE_PATH}/settings/integrations?payment=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Betalningen misslyckades');
        toast.error(error.message || 'Betalningen misslyckades');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success(`Betalning genomförd! ${amount / 100} kr har lagts till.`);
        queryClient.invalidateQueries({ queryKey: ['ai-balance'] });
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ett fel uppstod');
      toast.error('Ett fel uppstod vid betalningen');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-4 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader size={18} className="animate-spin" />
              Bearbetar...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Betala {amount / 100} kr
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(5000); // Default 50 kr
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'payment'>('select');

  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setClientSecret(null);
    }
  }, [isOpen]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_PATH}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedAmount }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Kunde inte skapa betalning');
      }

      setClientSecret(data.data.clientSecret);
      setStep('payment');
    } catch (err: any) {
      toast.error(err.message || 'Ett fel uppstod');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ladda på AI-krediter
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Välj belopp att ladda på. Varje AI-skanning kostar 2 kr.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_OPTIONS.map((option) => (
                  <button
                    key={option.amount}
                    onClick={() => setSelectedAmount(option.amount)}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all
                      ${selectedAmount === option.amount
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      {selectedAmount === option.amount && (
                        <Check size={18} className="text-primary-500" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {option.scans} skanningar
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={createPaymentIntent}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Förbereder...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Fortsätt till betalning
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'payment' && clientSecret && (
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#3b82f6',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <PaymentForm 
                amount={selectedAmount}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            </Elements>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Säker betalning via Stripe. Dina kortuppgifter hanteras aldrig av oss.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;

