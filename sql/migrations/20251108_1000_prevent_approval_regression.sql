-- =========================================================
-- Migration: Prevent Approval Regression Trigger
-- Date: 2025-11-08
-- Description: Förhindrar oavsiktlig regression från 'approved' -> 'pending'
--               Detta är en failsafe som skyddar mot att approval_status
--               degraderas när offline sync eller andra operationer körs
-- =========================================================

-- Skapa funktion som förhindrar regression från approved till pending
CREATE OR REPLACE FUNCTION prevent_approval_regression()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Endast agera vid UPDATE operationer
  IF TG_OP = 'UPDATE' THEN
    -- Om någon försöker sätta approval_status till 'pending' när den redan är 'approved'
    IF NEW.approval_status = 'pending' AND OLD.approval_status = 'approved' THEN
      -- Behåll approved status och metadata
      NEW.approval_status := OLD.approval_status;
      NEW.approved_at := OLD.approved_at;
      NEW.approved_by := OLD.approved_by;
      
      -- Logga varning (kan tas bort i produktion om önskat)
      RAISE WARNING 'Attempted to regress approval_status from approved to pending for entry % - prevented', OLD.id;
    END IF;
    
    -- Om någon försöker sätta status till 'pending' när den redan är 'approved' (legacy kolumn)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'time_entries' AND column_name = 'status'
    ) THEN
      IF NEW.status = 'pending' AND OLD.status = 'approved' THEN
        NEW.status := OLD.status;
        RAISE WARNING 'Attempted to regress status from approved to pending for entry % - prevented', OLD.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ta bort befintlig trigger om den finns
DROP TRIGGER IF EXISTS trg_prevent_approval_regression ON public.time_entries;

-- Skapa trigger som körs före UPDATE
CREATE TRIGGER trg_prevent_approval_regression
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_approval_regression();

-- Kommentar för dokumentation
COMMENT ON FUNCTION prevent_approval_regression() IS 
  'Förhindrar oavsiktlig regression av approval_status från approved till pending. Detta skyddar mot att offline sync eller andra operationer skriver över godkänd status.';

