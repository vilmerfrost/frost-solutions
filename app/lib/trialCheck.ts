// app/lib/trialCheck.ts
// Utility to check if a user's trial has expired

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export interface TrialStatus {
  isTrialing: boolean;
  trialExpired: boolean;
  hasActiveSubscription: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
}

/**
 * Check if the current user's trial has expired (server-side)
 * Returns true if trial is expired and no active subscription
 */
export async function checkTrialExpired(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false; // Not logged in, let auth handle it
    }

    const admin = createAdminClient();
    
    // Get user's subscription status
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('status, trial_end, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription) {
      // No subscription record - check profiles for legacy trial_ends_at
      const { data: profile } = await admin
        .from('profiles')
        .select('trial_ends_at, subscription_status')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.trial_ends_at) {
        return false; // No trial info, allow access
      }

      const trialEnded = new Date(profile.trial_ends_at) < new Date();
      const hasActiveSubscription = profile.subscription_status === 'active';

      return trialEnded && !hasActiveSubscription;
    }

    // Check subscription status
    const isActive = subscription.status === 'active';
    const isTrialing = subscription.status === 'trialing';
    
    if (isActive) {
      return false; // Has active paid subscription
    }

    if (isTrialing && subscription.trial_end) {
      const trialEnd = new Date(subscription.trial_end);
      return trialEnd < new Date(); // Trial expired
    }

    // If status is something else (canceled, past_due, etc.)
    return !isActive && !isTrialing;
  } catch (error) {
    console.error('[TrialCheck] Error:', error);
    return false; // On error, allow access (fail open)
  }
}

/**
 * Get detailed trial status for a user (server-side)
 */
export async function getTrialStatus(): Promise<TrialStatus> {
  const defaultStatus: TrialStatus = {
    isTrialing: false,
    trialExpired: false,
    hasActiveSubscription: false,
    daysRemaining: 0,
    trialEndsAt: null,
  };

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return defaultStatus;
    }

    const admin = createAdminClient();
    
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('status, trial_end, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription) {
      return defaultStatus;
    }

    const now = new Date();
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;
    const isTrialing = subscription.status === 'trialing';
    const isActive = subscription.status === 'active';

    let daysRemaining = 0;
    if (trialEnd && trialEnd > now) {
      daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      isTrialing,
      trialExpired: trialEnd ? trialEnd < now : false,
      hasActiveSubscription: isActive,
      daysRemaining,
      trialEndsAt: trialEnd,
    };
  } catch (error) {
    console.error('[TrialStatus] Error:', error);
    return defaultStatus;
  }
}
