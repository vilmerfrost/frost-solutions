CREATE TABLE IF NOT EXISTS public.signing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  idura_order_id TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL CHECK (document_type IN ('quote', 'invoice', 'contract', 'ata')),
  document_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected', 'expired', 'cancelled')),
  signatories JSONB DEFAULT '[]',
  signed_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_signing_orders_idura ON public.signing_orders(idura_order_id);
CREATE INDEX idx_signing_orders_document ON public.signing_orders(document_type, document_id);
ALTER TABLE public.signing_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.signing_orders FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Service role full access" ON public.signing_orders FOR ALL USING (auth.role() = 'service_role');
