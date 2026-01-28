-- ============================================
-- Enhanced Material System Migration
-- Adds support for:
--   - Purchase/sale price separation
--   - Stock management
--   - Supplier information
--   - Environmental certifications
-- ============================================

-- Fixed category options
ALTER TABLE materials ADD COLUMN IF NOT EXISTS category_type TEXT;
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materials_category_type_check'
  ) THEN
    ALTER TABLE materials ADD CONSTRAINT materials_category_type_check 
      CHECK (category_type IS NULL OR category_type IN (
        'CONSTRUCTION', 'PLUMBING', 'ELECTRICAL', 'FLOORING', 
        'ROOFING', 'PAINTING', 'TOOLS', 'SAFETY', 'OTHER'
      ));
  END IF;
END $$;

-- Enhanced unit options
-- Note: unit already exists, this just ensures proper values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'materials_unit_check'
  ) THEN
    ALTER TABLE materials ADD CONSTRAINT materials_unit_check 
      CHECK (unit IS NULL OR unit IN (
        'st', 'm', 'm2', 'm3', 'kg', 'L', 'pack', 'roll'
      ));
  END IF;
EXCEPTION WHEN others THEN
  NULL; -- Constraint may fail if existing data doesn't match
END $$;

-- Package quantity
ALTER TABLE materials ADD COLUMN IF NOT EXISTS package_quantity NUMERIC(10,2) DEFAULT 1;

-- Pricing
ALTER TABLE materials ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2); -- Inköpspris
ALTER TABLE materials ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2);     -- Försäljningspris
-- Margin calculated automatically: (sale_price - purchase_price) / purchase_price * 100

-- Stock management
ALTER TABLE materials ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(10,2) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS min_stock_level NUMERIC(10,2) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS stock_location TEXT;

-- Supplier information
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier_article_number TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier_url TEXT;

-- Environmental certifications
ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_eco_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_recyclable BOOLEAN DEFAULT FALSE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_hazardous BOOLEAN DEFAULT FALSE;

-- Notes
ALTER TABLE materials ADD COLUMN IF NOT EXISTS notes TEXT;

-- Status
ALTER TABLE materials ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ============================================
-- Suppliers table (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS suppliers (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id UUID NOT NULL,
 name TEXT NOT NULL,
 org_number TEXT,
 contact_name TEXT,
 contact_email TEXT,
 contact_phone TEXT,
 website TEXT,
 address TEXT,
 notes TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tenant_id index and RLS
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'suppliers_tenant_policy' AND tablename = 'suppliers'
  ) THEN
    CREATE POLICY suppliers_tenant_policy ON suppliers
      FOR ALL
      USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
      WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_materials_category_type ON materials(category_type);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_stock ON materials(stock_quantity) WHERE stock_quantity <= min_stock_level;

-- ============================================
-- Comments
-- ============================================

COMMENT ON COLUMN materials.purchase_price IS 'Inköpspris per enhet';
COMMENT ON COLUMN materials.sale_price IS 'Försäljningspris per enhet';
COMMENT ON COLUMN materials.min_stock_level IS 'Minimum stock level for low-stock alerts';
COMMENT ON COLUMN materials.is_hazardous IS 'Contains hazardous materials or chemicals';
