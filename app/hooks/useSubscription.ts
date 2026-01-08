// app/hooks/useSubscription.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly_sek: number;
  price_yearly_sek: number;
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  is_popular: boolean;
}

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  billing_cycle: 'monthly' | 'yearly';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionInvoice {
  id: string;
  amount_paid: number;
  currency: string;
  status: string;
  paid_at: string;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
}

interface CurrentSubscriptionData {
  subscription: Subscription;
  plan: SubscriptionPlan;
  invoices: SubscriptionInvoice[];
  isActive: boolean;
  isTrialing: boolean;
  daysRemaining: number;
}

// Fetch available plans
export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      const data = await res.json();
      return data.data || [];
    },
  });
}

// Fetch current subscription
export function useCurrentSubscription() {
  return useQuery<CurrentSubscriptionData>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/current');
      if (!res.ok) throw new Error('Failed to fetch subscription');
      const data = await res.json();
      return data.data;
    },
  });
}

// Create checkout session
export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      billingCycle,
    }: {
      planId: string;
      billingCycle: 'monthly' | 'yearly';
    }) => {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const data = await res.json();
      return data.data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kunde inte starta betalning');
    },
  });
}

// Get customer portal URL
export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to get portal URL');
      }

      const data = await res.json();
      return data.data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kunde inte öppna kundportalen');
    },
  });
}

