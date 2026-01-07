-- ============================================================================
-- SUBSCRIPTION SYSTEM MIGRATION
-- Autonomous SaaS subscription flow for Frost Solutions
-- Created: 2026-01-09
-- ============================================================================

-- ============================================================================
-- Table: subscription_plans
-- Defines available subscription tiers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly_sek DECIMAL(10,2) NOT NULL,
  price_yearly_sek DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: subscriptions
-- Tracks tenant subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'
  )),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Stripe IDs
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Dates
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  -- Metadata
  cancel_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- ============================================================================
-- Table: subscription_invoices
-- Tracks billing history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'SEK',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'open', 'paid', 'void', 'uncollectible'
  )),
  
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: subscription_events
-- Audit log for subscription changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Insert Default Plans
-- ============================================================================
INSERT INTO public.subscription_plans (
  name, display_name, description, price_monthly_sek, price_yearly_sek,
  features, limits, is_active, is_popular, sort_order
) VALUES
(
  'starter',
  'Starter',
  'Perfekt för enskilda hantverkare',
  299,
  2990,
  '["5 aktiva projekt", "Tidrapportering", "Fakturering", "Mobilapp", "E-postsupport"]',
  '{"max_projects": 5, "max_employees": 1, "max_invoices_month": 20, "ai_scans_month": 10}',
  true, false, 1
),
(
  'professional',
  'Professional',
  'För växande byggföretag',
  699,
  6990,
  '["25 aktiva projekt", "Obegränsade anställda", "ROT/RUT-avdrag", "Fortnox-integration", "AI-funktioner", "Prioriterad support"]',
  '{"max_projects": 25, "max_employees": -1, "max_invoices_month": -1, "ai_scans_month": 50}',
  true, true, 2
),
(
  'enterprise',
  'Enterprise',
  'För stora byggföretag',
  1499,
  14990,
  '["Obegränsade projekt", "Obegränsade anställda", "Alla integrationer", "Obegränsade AI-funktioner", "Dedikerad support", "API-åtkomst", "Anpassade rapporter"]',
  '{"max_projects": -1, "max_employees": -1, "max_invoices_month": -1, "ai_scans_month": -1}',
  true, false, 3
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly_sek = EXCLUDED.price_monthly_sek,
  price_yearly_sek = EXCLUDED.price_yearly_sek,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_tenant ON public.subscription_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_stripe ON public.subscription_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_tenant ON public.subscription_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON public.subscription_events(event_type);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Plans: Public read
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Subscriptions: Tenant isolation
CREATE POLICY "Tenants can view own subscription" ON public.subscriptions
  FOR SELECT USING (tenant_id = app.current_tenant_id());

CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Invoices: Tenant isolation
CREATE POLICY "Tenants can view own invoices" ON public.subscription_invoices
  FOR SELECT USING (tenant_id = app.current_tenant_id());

CREATE POLICY "Service role manages invoices" ON public.subscription_invoices
  FOR ALL USING (auth.role() = 'service_role');

-- Events: Tenant isolation
CREATE POLICY "Tenants can view own events" ON public.subscription_events
  FOR SELECT USING (tenant_id = app.current_tenant_id());

CREATE POLICY "Service role manages events" ON public.subscription_events
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Functions
-- ============================================================================

-- Get or create subscription for tenant (with trial)
CREATE OR REPLACE FUNCTION public.get_or_create_subscription(
  p_tenant_id UUID,
  p_plan_name TEXT DEFAULT 'starter'
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription public.subscriptions;
  v_plan public.subscription_plans;
BEGIN
  -- Check existing
  SELECT * INTO v_subscription FROM public.subscriptions WHERE tenant_id = p_tenant_id;
  IF FOUND THEN
    RETURN v_subscription;
  END IF;
  
  -- Get plan
  SELECT * INTO v_plan FROM public.subscription_plans WHERE name = p_plan_name AND is_active = true;
  IF NOT FOUND THEN
    SELECT * INTO v_plan FROM public.subscription_plans WHERE name = 'starter' AND is_active = true;
  END IF;
  
  -- Create trial subscription
  INSERT INTO public.subscriptions (
    tenant_id,
    plan_id,
    status,
    billing_cycle,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end
  ) VALUES (
    p_tenant_id,
    v_plan.id,
    'trialing',
    'monthly',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW() + INTERVAL '14 days'
  )
  RETURNING * INTO v_subscription;
  
  -- Log event
  INSERT INTO public.subscription_events (tenant_id, subscription_id, event_type, data)
  VALUES (p_tenant_id, v_subscription.id, 'trial_started', jsonb_build_object(
    'plan', v_plan.name,
    'trial_days', 14
  ));
  
  RETURN v_subscription;
END;
$$;

-- Check if tenant has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub public.subscriptions;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions WHERE tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Active statuses
  IF v_sub.status IN ('active', 'trialing') THEN
    -- Check if trial/period hasn't expired
    IF v_sub.status = 'trialing' AND v_sub.trial_end < NOW() THEN
      RETURN false;
    END IF;
    IF v_sub.current_period_end < NOW() THEN
      RETURN false;
    END IF;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Check subscription limit
CREATE OR REPLACE FUNCTION public.check_subscription_limit(
  p_tenant_id UUID,
  p_limit_key TEXT,
  p_current_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  allowed BOOLEAN,
  limit_value INTEGER,
  current_value INTEGER,
  plan_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub public.subscriptions;
  v_plan public.subscription_plans;
  v_limit INTEGER;
BEGIN
  SELECT s.*, p.* INTO v_sub, v_plan
  FROM public.subscriptions s
  JOIN public.subscription_plans p ON s.plan_id = p.id
  WHERE s.tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    -- No subscription, use starter limits
    SELECT * INTO v_plan FROM public.subscription_plans WHERE name = 'starter';
  END IF;
  
  v_limit := (v_plan.limits ->> p_limit_key)::INTEGER;
  
  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN QUERY SELECT true, -1, p_current_count, v_plan.name;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT p_current_count < v_limit, v_limit, p_current_count, v_plan.name;
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================
GRANT SELECT ON public.subscription_plans TO authenticated, anon;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.subscription_invoices TO authenticated;
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription_limit TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.subscription_plans IS 'Available subscription tiers for SaaS';
COMMENT ON TABLE public.subscriptions IS 'Tenant subscription records';
COMMENT ON TABLE public.subscription_invoices IS 'Billing history for subscriptions';
COMMENT ON TABLE public.subscription_events IS 'Audit log for subscription changes';

