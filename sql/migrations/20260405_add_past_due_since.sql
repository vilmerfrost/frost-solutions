-- Add past_due_since column to subscriptions table
-- Tracks the exact moment a subscription entered past_due status
-- Used for reliable grace period calculation instead of updated_at
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMPTZ;
