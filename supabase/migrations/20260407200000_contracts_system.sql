-- supabase/migrations/20260407200000_contracts_system.sql
-- Contracts system: contracts and contract_items tables with auto-numbering

-- ============================================================
-- 1. CONTRACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES public.tenants(id),
  project_id        UUID        REFERENCES public.projects(id),
  client_id         UUID        REFERENCES public.clients(id),
  contract_type     TEXT        CHECK (contract_type IN ('client', 'subcontractor')),
  template_id       TEXT,
  contract_number   TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  description       TEXT,
  sections          JSONB       NOT NULL DEFAULT '[]',
  counterparty_name TEXT,
  subtotal          NUMERIC(12,2),
  tax_amount        NUMERIC(12,2),
  total_amount      NUMERIC(12,2),
  start_date        DATE,
  end_date          DATE,
  valid_until       DATE,
  status            TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'sent', 'signed', 'active', 'completed', 'cancelled')),
  signed_pdf_url    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contracts IS 'Client and subcontractor contracts per project';
COMMENT ON COLUMN public.contracts.sections IS 'JSONB array of contract sections with content blocks';
COMMENT ON COLUMN public.contracts.contract_type IS 'client = contract with client, subcontractor = contract with subcontractor';

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_tenant_select" ON public.contracts
  FOR SELECT USING (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);
CREATE POLICY "contracts_tenant_insert" ON public.contracts
  FOR INSERT WITH CHECK (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);
CREATE POLICY "contracts_tenant_update" ON public.contracts
  FOR UPDATE USING (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);
CREATE POLICY "contracts_tenant_delete" ON public.contracts
  FOR DELETE USING (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);
CREATE POLICY "contracts_service_all" ON public.contracts
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_contracts_tenant        ON public.contracts(tenant_id);
CREATE INDEX idx_contracts_tenant_status ON public.contracts(tenant_id, status);
CREATE INDEX idx_contracts_project       ON public.contracts(project_id);
CREATE INDEX idx_contracts_client        ON public.contracts(client_id);

-- ============================================================
-- 2. CONTRACT ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID        NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  item_type     TEXT        NOT NULL DEFAULT 'labor'
                            CHECK (item_type IN ('material', 'labor', 'other')),
  description   TEXT        NOT NULL,
  quantity      NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit          TEXT        NOT NULL DEFAULT 'st',
  unit_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate      NUMERIC(5,2)  NOT NULL DEFAULT 25.00,
  line_total    NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contract_items IS 'Line items for contracts (materials, labor, other)';

ALTER TABLE public.contract_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_items_tenant_select" ON public.contract_items
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM public.contracts
      WHERE tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid
    )
  );
CREATE POLICY "contract_items_tenant_insert" ON public.contract_items
  FOR INSERT WITH CHECK (
    contract_id IN (
      SELECT id FROM public.contracts
      WHERE tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid
    )
  );
CREATE POLICY "contract_items_tenant_update" ON public.contract_items
  FOR UPDATE USING (
    contract_id IN (
      SELECT id FROM public.contracts
      WHERE tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid
    )
  );
CREATE POLICY "contract_items_tenant_delete" ON public.contract_items
  FOR DELETE USING (
    contract_id IN (
      SELECT id FROM public.contracts
      WHERE tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid
    )
  );
CREATE POLICY "contract_items_service_all" ON public.contract_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_contract_items_contract ON public.contract_items(contract_id);

-- ============================================================
-- 3. AUTO-NUMBERING FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_contract_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year    TEXT;
  v_count   INT;
  v_number  TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');

  SELECT COUNT(*) + 1
    INTO v_count
    FROM public.contracts
   WHERE tenant_id = p_tenant_id
     AND to_char(created_at, 'YYYY') = v_year;

  v_number := 'AVT-' || v_year || '-' || lpad(v_count::TEXT, 3, '0');

  RETURN v_number;
END;
$$;

COMMENT ON FUNCTION public.generate_contract_number(UUID) IS
  'Returns next sequential contract number for a tenant in format AVT-YYYY-NNN';
