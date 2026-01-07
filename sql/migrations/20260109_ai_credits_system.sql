-- AI Credits System Migration
-- Created: 2026-01-09
-- Purpose: Implement pay-per-scan for AI features (2 SEK per scan)

-- ============================================================================
-- Table: ai_credits
-- Stores credit balance per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_topped_up DECIMAL(10,2) DEFAULT 0,
  last_topup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- ============================================================================
-- Table: ai_transactions
-- Logs all credit transactions (charges and top-ups)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('charge', 'topup', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  feature TEXT NOT NULL, -- 'supplier_invoice_ocr', 'rot_summary', 'delivery_note_ocr', etc.
  description TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  balance_before DECIMAL(10,2),
  balance_after DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- Table: ai_pricing
-- Configurable pricing per feature (default: 2 SEK = 200 öre)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature TEXT NOT NULL UNIQUE,
  price_sek DECIMAL(10,2) NOT NULL DEFAULT 2.00,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO public.ai_pricing (feature, price_sek, display_name, description) VALUES
  ('supplier_invoice_ocr', 2.00, 'Leverantörsfaktura OCR', 'AI-scanning av leverantörsfaktura'),
  ('delivery_note_ocr', 2.00, 'Följesedel OCR', 'AI-scanning av följesedel'),
  ('receipt_ocr', 2.00, 'Kvitto OCR', 'AI-scanning av kvitto'),
  ('rot_rut_summary', 2.00, 'ROT/RUT Sammanfattning', 'AI-genererad ROT/RUT sammanfattning'),
  ('project_insights', 2.00, 'Projektinsikter', 'AI-genererade projektinsikter'),
  ('payroll_validation', 2.00, 'Lönevalidering', 'AI-validering av löneunderlag'),
  ('monthly_report', 2.00, 'Månadsrapport', 'AI-genererad månadsrapport')
ON CONFLICT (feature) DO NOTHING;

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_credits_tenant ON public.ai_credits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_tenant ON public.ai_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_created ON public.ai_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_type ON public.ai_transactions(type);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_feature ON public.ai_transactions(feature);
CREATE INDEX IF NOT EXISTS idx_ai_transactions_stripe ON public.ai_transactions(stripe_payment_intent_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pricing ENABLE ROW LEVEL SECURITY;

-- ai_credits policies
CREATE POLICY "Tenants can view own credits" ON public.ai_credits
  FOR SELECT USING (tenant_id = app.current_tenant_id());

CREATE POLICY "Service role can manage credits" ON public.ai_credits
  FOR ALL USING (auth.role() = 'service_role');

-- ai_transactions policies
CREATE POLICY "Tenants can view own transactions" ON public.ai_transactions
  FOR SELECT USING (tenant_id = app.current_tenant_id());

CREATE POLICY "Service role can manage transactions" ON public.ai_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- ai_pricing policies (public read)
CREATE POLICY "Anyone can view pricing" ON public.ai_pricing
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage pricing" ON public.ai_pricing
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to get or create credit record for tenant
CREATE OR REPLACE FUNCTION public.get_or_create_ai_credits(p_tenant_id UUID)
RETURNS public.ai_credits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits public.ai_credits;
BEGIN
  SELECT * INTO v_credits FROM public.ai_credits WHERE tenant_id = p_tenant_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.ai_credits (tenant_id, balance, total_spent, total_topped_up)
    VALUES (p_tenant_id, 0, 0, 0)
    RETURNING * INTO v_credits;
  END IF;
  
  RETURN v_credits;
END;
$$;

-- Function to check if tenant has sufficient balance
CREATE OR REPLACE FUNCTION public.check_ai_balance(p_tenant_id UUID, p_feature TEXT)
RETURNS TABLE (
  has_balance BOOLEAN,
  current_balance DECIMAL(10,2),
  required_amount DECIMAL(10,2),
  feature_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits public.ai_credits;
  v_price DECIMAL(10,2);
  v_feature_name TEXT;
BEGIN
  -- Get pricing
  SELECT price_sek, display_name INTO v_price, v_feature_name
  FROM public.ai_pricing
  WHERE feature = p_feature AND is_active = true;
  
  IF NOT FOUND THEN
    v_price := 2.00; -- Default price
    v_feature_name := p_feature;
  END IF;
  
  -- Get or create credits
  v_credits := public.get_or_create_ai_credits(p_tenant_id);
  
  RETURN QUERY SELECT 
    v_credits.balance >= v_price,
    v_credits.balance,
    v_price,
    v_feature_name;
END;
$$;

-- Function to charge credits for AI usage
CREATE OR REPLACE FUNCTION public.charge_ai_credits(
  p_tenant_id UUID,
  p_feature TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  transaction_id UUID,
  new_balance DECIMAL(10,2),
  amount_charged DECIMAL(10,2),
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits public.ai_credits;
  v_price DECIMAL(10,2);
  v_balance_before DECIMAL(10,2);
  v_balance_after DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  -- Get pricing
  SELECT price_sek INTO v_price
  FROM public.ai_pricing
  WHERE feature = p_feature AND is_active = true;
  
  IF NOT FOUND THEN
    v_price := 2.00; -- Default price
  END IF;
  
  -- Get or create credits
  v_credits := public.get_or_create_ai_credits(p_tenant_id);
  v_balance_before := v_credits.balance;
  
  -- Check balance
  IF v_balance_before < v_price THEN
    RETURN QUERY SELECT 
      false,
      NULL::UUID,
      v_balance_before,
      v_price,
      'Otillräckligt saldo. Ladda på för att fortsätta.'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate new balance
  v_balance_after := v_balance_before - v_price;
  
  -- Update credits
  UPDATE public.ai_credits
  SET 
    balance = v_balance_after,
    total_spent = total_spent + v_price,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
  
  -- Create transaction record
  INSERT INTO public.ai_transactions (
    tenant_id,
    type,
    amount,
    feature,
    description,
    balance_before,
    balance_after,
    metadata
  ) VALUES (
    p_tenant_id,
    'charge',
    v_price,
    p_feature,
    COALESCE(p_description, 'AI-funktionsanvändning'),
    v_balance_before,
    v_balance_after,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN QUERY SELECT 
    true,
    v_transaction_id,
    v_balance_after,
    v_price,
    NULL::TEXT;
END;
$$;

-- Function to add credits (top-up)
CREATE OR REPLACE FUNCTION public.topup_ai_credits(
  p_tenant_id UUID,
  p_amount DECIMAL(10,2),
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_stripe_charge_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  success BOOLEAN,
  transaction_id UUID,
  new_balance DECIMAL(10,2),
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits public.ai_credits;
  v_balance_before DECIMAL(10,2);
  v_balance_after DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT 
      false,
      NULL::UUID,
      0::DECIMAL(10,2),
      'Belopp måste vara positivt'::TEXT;
    RETURN;
  END IF;
  
  -- Get or create credits
  v_credits := public.get_or_create_ai_credits(p_tenant_id);
  v_balance_before := v_credits.balance;
  v_balance_after := v_balance_before + p_amount;
  
  -- Update credits
  UPDATE public.ai_credits
  SET 
    balance = v_balance_after,
    total_topped_up = total_topped_up + p_amount,
    last_topup_at = NOW(),
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id;
  
  -- Create transaction record
  INSERT INTO public.ai_transactions (
    tenant_id,
    type,
    amount,
    feature,
    description,
    stripe_payment_intent_id,
    stripe_charge_id,
    balance_before,
    balance_after,
    metadata
  ) VALUES (
    p_tenant_id,
    'topup',
    p_amount,
    'topup',
    'Påfyllning av AI-krediter',
    p_stripe_payment_intent_id,
    p_stripe_charge_id,
    v_balance_before,
    v_balance_after,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN QUERY SELECT 
    true,
    v_transaction_id,
    v_balance_after,
    NULL::TEXT;
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================
GRANT SELECT ON public.ai_credits TO authenticated;
GRANT SELECT ON public.ai_transactions TO authenticated;
GRANT SELECT ON public.ai_pricing TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_ai_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.charge_ai_credits TO service_role;
GRANT EXECUTE ON FUNCTION public.topup_ai_credits TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.ai_credits IS 'Stores AI credit balance per tenant';
COMMENT ON TABLE public.ai_transactions IS 'Transaction log for AI credit charges and top-ups';
COMMENT ON TABLE public.ai_pricing IS 'Pricing configuration for AI features';
COMMENT ON FUNCTION public.charge_ai_credits IS 'Deducts credits for AI feature usage';
COMMENT ON FUNCTION public.topup_ai_credits IS 'Adds credits after successful Stripe payment';

