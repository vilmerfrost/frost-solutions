-- Phase 3: Credit checks — add credit scoring columns to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS credit_score INTEGER,
  ADD COLUMN IF NOT EXISTS credit_level TEXT CHECK (credit_level IN ('GREEN', 'YELLOW', 'RED')),
  ADD COLUMN IF NOT EXISTS credit_checked_at TIMESTAMPTZ;
