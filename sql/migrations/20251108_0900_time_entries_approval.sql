-- =========================================================
-- Time Entries Approval Columns & Defaults
-- Adds approval_status/approved_at/approved_by if missing
-- =========================================================

alter table public.time_entries
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.employees(id);

-- Ensure existing rows have a non-null status
update public.time_entries
set approval_status = coalesce(approval_status, 'pending')
where approval_status is null;

-- Promote rows already marked approved via other columns
update public.time_entries
set approval_status = 'approved'
where approval_status <> 'approved'
  and (
    coalesce(status, '') = 'approved'
    or coalesce(approval_status, '') = 'approved'
    or approved_at is not null
  );

create index if not exists idx_time_entries_approval_status
  on public.time_entries (approval_status)
  where approval_status <> 'approved';
