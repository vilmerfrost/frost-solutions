-- =========================================================
-- Storage Bucket for Payroll Exports
-- =========================================================

-- 1) Create the storage bucket if it doesn't exist
--    This is typically done via Supabase UI, but SQL is provided for completeness.
--    Note: `supabase_storage.create_bucket` requires superuser privileges.
--    If running as a regular user, create it via the UI.

-- DO NOT RUN THIS IF YOU ARE NOT A SUPERUSER OR HAVE ALREADY CREATED THE BUCKET VIA UI
-- SELECT supabase_storage.create_bucket('payroll_exports', '{ "public": false }');

-- 2) Enable RLS for the bucket (already enabled by default for new buckets)
--    This ensures that access is controlled by policies.

-- 3) Create RLS policies for the 'payroll_exports' bucket
--    These policies ensure that only authenticated users belonging to the correct tenant
--    can upload, view, and delete their own payroll export files.

-- Policy for SELECT (read access)
drop policy if exists "Allow authenticated tenant users to read their own payroll export files" on storage.objects;
create policy "Allow authenticated tenant users to read their own payroll export files"
on storage.objects for select
using (
  bucket_id = 'payroll_exports'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = (select tenant_id::text from app.user_roles where user_id = auth.uid() limit 1)
);

-- Policy for INSERT (upload access)
drop policy if exists "Allow authenticated tenant users to upload their own payroll export files" on storage.objects;
create policy "Allow authenticated tenant users to upload their own payroll export files"
on storage.objects for insert
with check (
  bucket_id = 'payroll_exports'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = (select tenant_id::text from app.user_roles where user_id = auth.uid() limit 1)
);

-- Policy for UPDATE (modify access - less common for exports, but good to have)
drop policy if exists "Allow authenticated tenant users to update their own payroll export files" on storage.objects;
create policy "Allow authenticated tenant users to update their own payroll export files"
on storage.objects for update
using (
  bucket_id = 'payroll_exports'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = (select tenant_id::text from app.user_roles where user_id = auth.uid() limit 1)
);

-- Policy for DELETE (delete access)
drop policy if exists "Allow authenticated tenant users to delete their own payroll export files" on storage.objects;
create policy "Allow authenticated tenant users to delete their own payroll export files"
on storage.objects for delete
using (
  bucket_id = 'payroll_exports'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = (select tenant_id::text from app.user_roles where user_id = auth.uid() limit 1)
);

-- Ensure the 'payroll_exports' bucket is not public
update storage.buckets set public = false where id = 'payroll_exports';

