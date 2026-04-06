ALTER TABLE public.ata_audit_trail
  ADD COLUMN IF NOT EXISTS event_hash TEXT,
  ADD COLUMN IF NOT EXISTS previous_hash TEXT;;
