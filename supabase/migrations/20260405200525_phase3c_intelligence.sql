CREATE TABLE IF NOT EXISTS public.supplier_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  supplier_url TEXT,
  product_name TEXT NOT NULL,
  product_url TEXT,
  category TEXT,
  sku TEXT,
  price_sek NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'st',
  in_stock BOOLEAN,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  previous_price_sek NUMERIC(10,2),
  price_change_percent NUMERIC(5,2)
);
CREATE INDEX IF NOT EXISTS idx_catalog_supplier ON public.supplier_catalog_items(supplier_name);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON public.supplier_catalog_items(category);
CREATE INDEX IF NOT EXISTS idx_catalog_scraped ON public.supplier_catalog_items(scraped_at);
CREATE INDEX IF NOT EXISTS idx_catalog_product_name ON public.supplier_catalog_items USING gin(to_tsvector('swedish', product_name));

CREATE TABLE IF NOT EXISTS public.material_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  product_name_pattern TEXT NOT NULL,
  threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  direction TEXT NOT NULL DEFAULT 'drop',
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.material_price_alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.material_price_alerts FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.material_price_alerts FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID,
  schedule TEXT,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Tenant isolation" ON public.saved_reports FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role" ON public.saved_reports FOR ALL USING (auth.role() = 'service_role'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;;
