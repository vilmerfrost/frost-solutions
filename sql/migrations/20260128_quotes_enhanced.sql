-- ============================================
-- Enhanced Quote System Migration
-- Adds support for:
--   - KMA visibility controls
--   - Markup percentage
-- ============================================

-- KMA fields
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS kma_visible_to_customer BOOLEAN DEFAULT TRUE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS kma_content TEXT;

-- Markup
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS markup_percent NUMERIC(5,2) DEFAULT 15;

-- Calculated totals (for quick access)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS subtotal_before_markup NUMERIC(12,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total_after_markup NUMERIC(12,2);

-- Comments
COMMENT ON COLUMN quotes.kma_visible_to_customer IS 'Whether to show KMA section to customer on PDF';
COMMENT ON COLUMN quotes.kma_content IS 'Environmental/cost analysis text content';
COMMENT ON COLUMN quotes.markup_percent IS 'Default markup percentage for quote items';
