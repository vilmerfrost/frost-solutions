-- Archived from supabase/migrations/102_fix_schema_columns.sql
-- Kept for reference only. Not part of the active Supabase migration history.

-- Migration: Fix schema column issues and add missing columns
-- This migration ensures all required columns exist and fixes naming inconsistencies

-- ============================================================================
-- 1. FIX EMPLOYEES TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'employees'
    AND column_name = 'name'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'employees'
      AND column_name = 'full_name'
    ) THEN
      ALTER TABLE public.employees ADD COLUMN name TEXT;
      UPDATE public.employees SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
    ELSE
      ALTER TABLE public.employees ADD COLUMN name TEXT;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'employees'
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN full_name TEXT;
    UPDATE public.employees SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
  ELSE
    UPDATE public.employees SET full_name = name WHERE (full_name IS NULL OR full_name = '') AND name IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'employees'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN email TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'employees'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'Employee', 'Admin'));
  END IF;
END $$;

-- ============================================================================
-- 2. FIX CLIENTS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clients'
    AND column_name = 'org_number'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN org_number TEXT;
  END IF;
END $$;

-- ============================================================================
-- 3. FIX PROJECTS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN status TEXT DEFAULT 'planned'
    CHECK (status IN ('planned', 'active', 'completed', 'archived'));
    UPDATE public.projects SET status = 'active' WHERE status IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
  END IF;
END $$;

-- ============================================================================
-- 4. FIX INVOICES TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN amount DECIMAL(10,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'cancelled'));
    UPDATE public.invoices SET status = 'draft' WHERE status IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'issue_date'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN issue_date DATE;
    UPDATE public.invoices SET issue_date = CURRENT_DATE WHERE issue_date IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
  END IF;
END $$;
