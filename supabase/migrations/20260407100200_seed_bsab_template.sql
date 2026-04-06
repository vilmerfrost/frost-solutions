-- supabase/migrations/20260407100200_seed_bsab_template.sql
-- Seed the built-in BSAB default template for each tenant.

INSERT INTO public.binder_templates (tenant_id, name, description, structure, is_default, created_by)
SELECT
  t.id,
  'BSAB Standard',
  'Standardmall baserad på BSAB-systemet för byggprojekt',
  '{
    "tabs": [
      { "name": "Ritningar", "key": "01-ritningar", "icon": "blueprint", "restricted": false },
      { "name": "Beskrivningar", "key": "02-beskrivningar", "icon": "file-text", "restricted": false },
      { "name": "Administrativt", "key": "03-administrativt", "icon": "folder", "restricted": false },
      { "name": "Avtal", "key": "04-avtal", "icon": "file-lock", "restricted": true },
      { "name": "Ekonomi", "key": "05-ekonomi", "icon": "banknote", "restricted": true },
      { "name": "Foton", "key": "06-foton", "icon": "camera", "restricted": false },
      { "name": "KMA", "key": "07-kma", "icon": "shield-check", "restricted": false }
    ]
  }'::jsonb,
  true,
  NULL
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.binder_templates bt
  WHERE bt.tenant_id = t.id AND bt.is_default = true
);
