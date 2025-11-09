-- =========================================================
-- SUPABASE STORAGE BUCKET: supplier_invoices
-- =========================================================
-- Kör denna SQL i Supabase SQL Editor för att skapa storage bucket
-- =========================================================

-- Skapa bucket (om den inte redan finns)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'supplier_invoices',
  'supplier_invoices',
  false, -- Privat bucket (kräver autentisering)
  10485760, -- 10MB max filstorlek
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Skapa RLS policies för bucket
-- Tillåt användare att ladda upp filer till sin tenant-mapp
CREATE POLICY IF NOT EXISTS "Users can upload supplier invoices to their tenant folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'supplier_invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM app.user_roles WHERE user_id = auth.uid()
  )
);

-- Tillåt användare att läsa filer från sin tenant-mapp
CREATE POLICY IF NOT EXISTS "Users can read supplier invoices from their tenant folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'supplier_invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM app.user_roles WHERE user_id = auth.uid()
  )
);

-- Tillåt användare att ta bort filer från sin tenant-mapp
CREATE POLICY IF NOT EXISTS "Users can delete supplier invoices from their tenant folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'supplier_invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM app.user_roles WHERE user_id = auth.uid()
  )
);

-- Kommentar
COMMENT ON TABLE storage.buckets IS 'Storage buckets för filer';
COMMENT ON COLUMN storage.buckets.id IS 'Bucket ID måste matcha bucket name';

