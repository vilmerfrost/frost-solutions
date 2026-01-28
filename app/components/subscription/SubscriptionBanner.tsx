// app/components/subscription/SubscriptionBanner.tsx
// Shows subscription status warnings and upgrade prompts
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentSubscription, useCustomerPortal } from '@/hooks/useSubscription';
import { AlertTriangle, Clock, CreditCard, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BannerType = 'trial_expiring' | 'trial_expired' | 'past_due' | 'grace_period' | 'canceled' | null;

interface BannerConfig {
  type: BannerType;
  title: string;
  message: string;
  bgColor: string;
  icon: React.ReactNode;
  showUpgrade: boolean;
  showPortal: boolean;
  dismissible: boolean;
  urgent: boolean;
}

export function SubscriptionBanner() {
  const router = useRouter();
  const { data: subscriptionData, isLoading } = useCurrentSubscription();
  const customerPortal = useCustomerPortal();
  const [dismissed, setDismissed] = useState<string | null>(null);

  const bannerConfig = useMemo((): BannerConfig | null => {
    if (!subscriptionData) return null;

    const { subscription, daysRemaining, isTrialing, isActive } = subscriptionData;
    const status = subscription?.status;

    // Grace period: 5 days after payment failure
    const gracePeriodEnd = subscription?.grace_period_end 
      ? new Date(subscription.grace_period_end) 
      : null;
    const isInGracePeriod = gracePeriodEnd && gracePeriodEnd > new Date();
    const graceDaysRemaining = gracePeriodEnd 
      ? Math.ceil((gracePeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    // Trial expiring soon (7 days or less)
    if (isTrialing && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0) {
      return {
        type: 'trial_expiring',
        title: `Din provperiod går ut om ${daysRemaining} dag${daysRemaining === 1 ? '' : 'ar'}`,
        message: 'Uppgradera nu för att behålla full tillgång till alla funktioner.',
        bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        icon: <Clock className="w-5 h-5" />,
        showUpgrade: true,
        showPortal: false,
        dismissible: true,
        urgent: daysRemaining <= 3,
      };
    }

    // Trial expired
    if (isTrialing && daysRemaining !== null && daysRemaining <= 0) {
      return {
        type: 'trial_expired',
        title: 'Din provperiod har gått ut',
        message: 'Uppgradera för att fortsätta använda alla funktioner. Dina data finns kvar!',
        bgColor: 'bg-gradient-to-r from-red-500 to-pink-500',
        icon: <AlertTriangle className="w-5 h-5" />,
        showUpgrade: true,
        showPortal: false,
        dismissible: false,
        urgent: true,
      };
    }

    // Payment failed - in grace period
    if (status === 'past_due' && isInGracePeriod) {
      return {
        type: 'grace_period',
        title: `Betalningen misslyckades - ${graceDaysRemaining} dagar kvar`,
        message: 'Uppdatera din betalningsmetod för att undvika avbrott i tjänsten.',
        bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
        icon: <CreditCard className="w-5 h-5" />,
        showUpgrade: false,
        showPortal: true,
        dismissible: false,
        urgent: graceDaysRemaining <= 2,
      };
    }

    // Past due without grace period
    if (status === 'past_due') {
      return {
        type: 'past_due',
        title: 'Betalningen har misslyckats',
        message: 'Uppdatera din betalningsmetod för att fortsätta använda tjänsten.',
        bgColor: 'bg-gradient-to-r from-red-600 to-red-700',
        icon: <AlertTriangle className="w-5 h-5" />,
        showUpgrade: false,
        showPortal: true,
        dismissible: false,
        urgent: true,
      };
    }

    // Canceled (will end at period end)
    if (status === 'canceled' && subscription?.cancel_at) {
      const cancelDate = new Date(subscription.cancel_at);
      const daysUntilCancel = Math.ceil((cancelDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilCancel > 0) {
        return {
          type: 'canceled',
          title: `Prenumerationen avslutas om ${daysUntilCancel} dagar`,
          message: 'Ändra dig? Återaktivera prenumerationen för att behålla alla funktioner.',
          bgColor: 'bg-gradient-to-r from-gray-600 to-gray-700',
          icon: <AlertTriangle className="w-5 h-5" />,
          showUpgrade: false,
          showPortal: true,
          dismissible: true,
          urgent: false,
        };
      }
    }

    return null;
  }, [subscriptionData]);

  // Don't show if loading, no config, or dismissed
  if (isLoading || !bannerConfig || dismissed === bannerConfig.type) {
    return null;
  }

  const handleUpgrade = () => {
    router.push('/settings?tab=subscription');
  };

  const handlePortal = () => {
    customerPortal.mutate();
  };

  return (
    <div 
      className={`${bannerConfig.bgColor} text-white px-4 py-3 ${bannerConfig.urgent ? 'animate-pulse-slow' : ''}`}
      role="alert"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg">
            {bannerConfig.icon}
          </div>
          <div>
            <p className="font-semibold text-sm sm:text-base">{bannerConfig.title}</p>
            <p className="text-white/90 text-xs sm:text-sm">{bannerConfig.message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {bannerConfig.showUpgrade && (
            <Button
              onClick={handleUpgrade}
              size="sm"
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Uppgradera nu
            </Button>
          )}
          
          {bannerConfig.showPortal && (
            <Button
              onClick={handlePortal}
              size="sm"
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
              disabled={customerPortal.isPending}
            >
              <CreditCard className="w-4 h-4 mr-1" />
              {customerPortal.isPending ? 'Öppnar...' : 'Hantera betalning'}
            </Button>
          )}
          
          {bannerConfig.dismissible && (
            <button
              onClick={() => setDismissed(bannerConfig.type)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Stäng"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionBanner;
