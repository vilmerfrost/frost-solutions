CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed')),
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_id ON public.stripe_events(stripe_event_id);
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role only" ON public.stripe_events FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMPTZ;;
