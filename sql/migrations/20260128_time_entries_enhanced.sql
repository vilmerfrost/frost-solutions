-- ============================================
-- Enhanced Time Entries Migration
-- Adds support for:
--   - ÄTA (change order) linking
--   - Mileage/kilometer tracking
--   - Photo documentation
-- ============================================

-- ÄTA linking
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS aeta_request_id UUID;

-- Foreign key to aeta_requests (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'aeta_requests') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'time_entries_aeta_request_fk'
    ) THEN
      ALTER TABLE time_entries 
        ADD CONSTRAINT time_entries_aeta_request_fk 
        FOREIGN KEY (aeta_request_id) REFERENCES aeta_requests(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Mileage tracking
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS mileage_km NUMERIC(10,2);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS travel_cost_sek NUMERIC(10,2);

-- Photo documentation
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Description field (ensure it exists)
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS description TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_aeta ON time_entries(aeta_request_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_mileage ON time_entries(mileage_km) WHERE mileage_km > 0;

-- Comments
COMMENT ON COLUMN time_entries.aeta_request_id IS 'Link to ÄTA request for change order work tracking';
COMMENT ON COLUMN time_entries.mileage_km IS 'Kilometers driven for this work entry';
COMMENT ON COLUMN time_entries.travel_cost_sek IS 'Calculated travel cost (mileage_km × rate)';
COMMENT ON COLUMN time_entries.photos IS 'Array of photo URLs documenting the work';
