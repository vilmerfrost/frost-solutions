'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/SidebarClient';
import { useCurrentSubscription, useCustomerPortal } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Calendar, CheckCircle, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast';

function SubscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, refetch } = useCurrentSubscription();
  const portalMutation = useCustomerPortal();

  // Handle checkout success/cancel redirects
  useEffect(() => {
    const success = searchParams?.get('success');
    const canceled = searchParams?.get('canceled');

    if (success === 'true') {
      toast.success('Tack för din betalning! Din prenumeration är nu aktiv.');
      // Remove query params
      router.replace('/settings/subscription');
      refetch();
    } else if (canceled === 'true') {
      toast.error('Betalningen avbröts. Du kan försöka igen när som helst.');
      router.replace('/settings/subscription');
    }
  }, [searchParams, router, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  const subscription = data?.subscription;
  const plan = data?.plan;
  const isTrialing = data?.isTrialing;
  const isActive = data?.isActive;
  const daysRemaining = data?.daysRemaining || 0;
  const invoices = data?.invoices || [];

  // Calculate trial end date
  const trialEndDate = subscription?.trial_end 
    ? new Date(subscription.trial_end).toLocaleDateString('sv-SE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null;

  const handleManageSubscription = () => {
    portalMutation.mutate();
  };

  const handleUpgrade = () => {
    // Use direct Stripe payment link
    const paymentLink = 'https://buy.stripe.com/cNi4gr9um8mq6TeesMdQQ00';
    window.location.href = paymentLink;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="space-y-6 p-4 md:p-6 lg:p-10 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Prenumeration
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Hantera din prenumeration och fakturor
              </p>
            </div>
          </div>

          {/* Trial Banner */}
          {isTrialing && (
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">
                    🎉 1 Månad Gratis!
                  </h2>
                  <p className="text-white/90 mb-3">
                    Du har {daysRemaining} dagar kvar av din gratisperiod. 
                    Efter det kostar prenumerationen {plan?.price_monthly_sek} kr/månad.
                  </p>
                  {trialEndDate && (
                    <p className="text-sm text-white/80">
                      Gratisperioden slutar: <strong>{trialEndDate}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Plan Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {plan?.display_name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {plan?.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {plan?.price_monthly_sek} kr
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    per månad
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Status Badge */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Status:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {isTrialing ? 'Gratis provperiod' : subscription?.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Inkluderade funktioner:
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {plan?.features?.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscription Details */}
              {subscription && (
                <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {subscription.current_period_start && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Nuvarande period:
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {new Date(subscription.current_period_start).toLocaleDateString('sv-SE')} -{' '}
                        {subscription.current_period_end &&
                          new Date(subscription.current_period_end).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Faktureringsfrekvens:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {subscription.billing_cycle === 'yearly' ? 'Årligen' : 'Månadsvis'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {subscription?.stripe_subscription_id ? (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalMutation.isPending}
                    className="flex-1"
                  >
                    {portalMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Laddar...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Hantera prenumeration
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleUpgrade}
                    className="flex-1"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Aktivera betalning
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Invoices */}
          {invoices.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fakturahistorik
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Belopp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Åtgärd
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(invoice.paid_at).toLocaleDateString('sv-SE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {invoice.amount_paid.toFixed(2)} {invoice.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {invoice.status === 'paid' ? 'Betald' : invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {invoice.hosted_invoice_url && (
                            <a
                              href={invoice.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              Visa faktura
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Tips:</strong> Du kan när som helst ändra din prenumeration, uppdatera betalningsmetod 
              eller säga upp via Stripe kundportal. Ingen bindningstid!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  );
}
