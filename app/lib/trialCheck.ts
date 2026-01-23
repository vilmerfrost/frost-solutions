// app/lib/trialCheck.ts
import { createClient } from '@/utils/supabase/server';

export interface TrialStatus {
  isActive: boolean;
  daysLeft: number;
  endsAt: Date | null;
  hasActiveSubscription: boolean;
}

/**
 * Check if user's trial has expired
 */
export async function checkTrialExpired(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return false; // Not logged in
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_ends_at, subscription_status')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) return false;
  
  const trialEnded = profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date();
  const hasActiveSubscription = profile.subscription_status === 'active';
  
  return trialEnded && !hasActiveSubscription;
}

/**
 * Get detailed trial status
 */
export async function getTrialStatus(): Promise<TrialStatus> {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      isActive: false,
      daysLeft: 0,
      endsAt: null,
      hasActiveSubscription: false,
    };
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_ends_at, subscription_status')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) {
    return {
      isActive: false,
      daysLeft: 0,
      endsAt: null,
      hasActiveSubscription: false,
    };
  }
  
  const endsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const now = new Date();
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const hasActiveSubscription = profile.subscription_status === 'active';
  const isActive = !!(endsAt && endsAt > now && !hasActiveSubscription);
  
  return {
    isActive,
    daysLeft,
    endsAt,
    hasActiveSubscription,
  };
}