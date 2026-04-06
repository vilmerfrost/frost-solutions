-- supabase/migrations/20260407100100_migrate_documents.sql
-- Migrate existing project_documents from folder-based to binder-based system.

-- Step 1: Create binders for projects that have documents but no binder yet
INSERT INTO public.binders (tenant_id, project_id, name, template_id, sort_order)
SELECT DISTINCT
  pd.tenant_id,
  pd.project_id,
  'BSAB Standard',
  bt.id,
  0
FROM public.project_documents pd
JOIN public.binder_templates bt ON bt.tenant_id = pd.tenant_id AND bt.is_default = true
WHERE pd.binder_tab_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.binders b
    WHERE b.project_id = pd.project_id AND b.tenant_id = pd.tenant_id
  );

-- Step 2: Create tabs for those binders from the BSAB template structure
DO $$
DECLARE
  binder_rec RECORD;
  tab_def JSONB;
  tab_idx INTEGER;
BEGIN
  FOR binder_rec IN
    SELECT b.id AS binder_id, b.tenant_id, bt.structure
    FROM public.binders b
    JOIN public.binder_templates bt ON bt.id = b.template_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.binder_tabs t WHERE t.binder_id = b.id
    )
  LOOP
    tab_idx := 0;
    FOR tab_def IN SELECT jsonb_array_elements(binder_rec.structure -> 'tabs')
    LOOP
      INSERT INTO public.binder_tabs (tenant_id, binder_id, name, key, sort_order, config)
      VALUES (
        binder_rec.tenant_id,
        binder_rec.binder_id,
        tab_def ->> 'name',
        tab_def ->> 'key',
        tab_idx,
        jsonb_build_object(
          'icon', tab_def ->> 'icon',
          'restricted_roles', CASE WHEN (tab_def ->> 'restricted')::boolean THEN '["admin"]'::jsonb ELSE '[]'::jsonb END
        )
      );
      tab_idx := tab_idx + 1;
    END LOOP;
  END LOOP;
END $$;

-- Step 3: Map existing folder values to binder_tab_id
UPDATE public.project_documents pd
SET binder_tab_id = bt.id
FROM public.binder_tabs bt
JOIN public.binders b ON b.id = bt.binder_id
WHERE b.project_id = pd.project_id
  AND b.tenant_id = pd.tenant_id
  AND pd.binder_tab_id IS NULL
  AND pd.folder IS NOT NULL
  AND bt.key = lower(split_part(pd.folder, '/', 1));
