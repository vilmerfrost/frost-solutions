-- =========================================================
-- Supplier Invoices (Leverantörsfakturor) – Core Schema
-- =========================================================
-- Förutsätter:
--  - public.tenants(id)
--  - public.projects(id), public.clients(id)
--  - app.user_roles(tenant_id, user_id, role)
--  - storage bucket: supplier_invoices (skapas i Supabase UI)
-- =========================================================

create extension if not exists pgcrypto;

-- 0) Helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 1) Suppliers
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  org_number text,
  email text,
  phone text,
  default_payment_terms_days int default 30,
  currency text not null default 'SEK',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists idx_suppliers_tenant on public.suppliers(tenant_id);
drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

-- 2) Supplier Invoices
create table if not exists public.supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  invoice_number text not null,
  invoice_date date not null,
  due_date date,
  status text not null default 'draft'
    check (status in ('draft','pending_approval','approved','booked','paid','archived','rejected')),
  currency text not null default 'SEK',
  exchange_rate numeric(12,6) not null default 1,
  amount_subtotal numeric(14,2) not null default 0,
  amount_tax numeric(14,2) not null default 0,
  amount_total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  amount_remaining numeric(14,2) generated always as (greatest(amount_total - amount_paid, 0)) stored,
  markup_total numeric(14,2) not null default 0,
  ocr_confidence numeric(5,2),
  file_path text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, supplier_id, invoice_number)
);

create index if not exists idx_supplier_invoices_tenant_status on public.supplier_invoices(tenant_id, status);
create index if not exists idx_supplier_invoices_project on public.supplier_invoices(project_id);
drop trigger if exists trg_supplier_invoices_updated_at on public.supplier_invoices;
create trigger trg_supplier_invoices_updated_at
before update on public.supplier_invoices
for each row execute function public.set_updated_at();

-- 3) Supplier Invoice Items
create table if not exists public.supplier_invoice_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_invoice_id uuid not null references public.supplier_invoices(id) on delete cascade,
  item_type text not null default 'material' check (item_type in ('material','labor','transport','other')),
  name text not null,
  description text,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'st',
  unit_price numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 25,
  order_index int not null default 1,
  line_total numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  tax_amount numeric(14,2) generated always as (round(line_total * (vat_rate/100.0), 2)) stored,
  created_at timestamptz not null default now()
);

create index if not exists idx_sii_invoice on public.supplier_invoice_items(supplier_invoice_id);
create index if not exists idx_sii_tenant on public.supplier_invoice_items(tenant_id);

-- 4) Allocations
create table if not exists public.supplier_invoice_allocations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_invoice_id uuid not null references public.supplier_invoices(id) on delete cascade,
  item_id uuid references public.supplier_invoice_items(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  cost_center text,
  amount numeric(14,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sia_invoice on public.supplier_invoice_allocations(supplier_invoice_id);

-- 5) Payments
create table if not exists public.supplier_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_invoice_id uuid not null references public.supplier_invoices(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  payment_date date not null,
  method text not null default 'bankgiro',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sip_invoice on public.supplier_invoice_payments(supplier_invoice_id);

-- 6) Approvals
create table if not exists public.supplier_invoice_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_invoice_id uuid not null references public.supplier_invoices(id) on delete cascade,
  approver_user_id uuid not null references auth.users(id) on delete cascade,
  level int not null default 1,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason text,
  changed_at timestamptz
);

create index if not exists idx_sia_approval_invoice on public.supplier_invoice_approvals(supplier_invoice_id);

-- 7) History
create table if not exists public.supplier_invoice_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_invoice_id uuid not null references public.supplier_invoices(id) on delete cascade,
  action text not null
    check (action in ('created','updated','approved','rejected','paid','booked','archived','ocr_scanned','markup_applied','converted')),
  data jsonb,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_sih_invoice on public.supplier_invoice_history(supplier_invoice_id);

-- 8) Markup rules
create table if not exists public.markup_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  active boolean not null default true,
  priority int not null default 100,
  item_type text,
  supplier_id uuid,
  project_id uuid,
  min_amount numeric(14,2),
  max_amount numeric(14,2),
  markup_percent numeric(6,3) default 0,
  markup_fixed numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mr_tenant_active on public.markup_rules(tenant_id, active, priority);
drop trigger if exists trg_markup_rules_updated_at on public.markup_rules;
create trigger trg_markup_rules_updated_at
before update on public.markup_rules
for each row execute function public.set_updated_at();

-- 9) Totals-recalc (trigger)
create or replace function public.recalc_supplier_invoice_totals(p_invoice_id uuid)
returns void language plpgsql as $$
declare
  v_sub numeric(14,2);
  v_tax numeric(14,2);
  v_total numeric(14,2);
  v_paid numeric(14,2);
begin
  select
    coalesce(sum(line_total),0),
    coalesce(sum(tax_amount),0)
  into v_sub, v_tax
  from public.supplier_invoice_items
  where supplier_invoice_id = p_invoice_id;

  v_total := v_sub + v_tax;

  select coalesce(sum(amount),0) into v_paid
  from public.supplier_invoice_payments
  where supplier_invoice_id = p_invoice_id;

  update public.supplier_invoices
  set amount_subtotal = v_sub,
      amount_tax = v_tax,
      amount_total = v_total,
      amount_paid = v_paid
  where id = p_invoice_id;
end $$;

create or replace function public.on_supplier_invoice_item_change()
returns trigger language plpgsql as $$
declare
  v_invoice_id uuid;
begin
  -- Handle both INSERT/UPDATE (new) and DELETE (old)
  v_invoice_id := COALESCE(new.supplier_invoice_id, old.supplier_invoice_id);
  
  if v_invoice_id is not null then
    perform public.recalc_supplier_invoice_totals(v_invoice_id);
  end if;
  
  -- Return appropriate row based on operation
  return COALESCE(new, old);
end $$;

create or replace function public.on_supplier_invoice_payment_change()
returns trigger language plpgsql as $$
declare
  v_invoice_id uuid;
begin
  -- Handle both INSERT/UPDATE (new) and DELETE (old)
  v_invoice_id := COALESCE(new.supplier_invoice_id, old.supplier_invoice_id);
  
  if v_invoice_id is not null then
    perform public.recalc_supplier_invoice_totals(v_invoice_id);
  end if;
  
  -- Return appropriate row based on operation
  return COALESCE(new, old);
end $$;

drop trigger if exists trg_sii_aiud on public.supplier_invoice_items;
create trigger trg_sii_aiud
after insert or update or delete on public.supplier_invoice_items
for each row execute function public.on_supplier_invoice_item_change();

drop trigger if exists trg_sip_aiud on public.supplier_invoice_payments;
create trigger trg_sip_aiud
after insert or update or delete on public.supplier_invoice_payments
for each row execute function public.on_supplier_invoice_payment_change();

-- 10) RLS
alter table public.suppliers enable row level security;
alter table public.supplier_invoices enable row level security;
alter table public.supplier_invoice_items enable row level security;
alter table public.supplier_invoice_allocations enable row level security;
alter table public.supplier_invoice_payments enable row level security;
alter table public.supplier_invoice_approvals enable row level security;
alter table public.supplier_invoice_history enable row level security;
alter table public.markup_rules enable row level security;

-- SELECT policies
create policy if not exists suppliers_select on public.suppliers
  for select using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists supplier_invoices_select on public.supplier_invoices
  for select using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists sii_select on public.supplier_invoice_items
  for select using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists sia_select on public.supplier_invoice_allocations
  for select using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists sip_select on public.supplier_invoice_payments
  for select using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists approval_select on public.supplier_invoice_approvals
  for select using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists sih_select on public.supplier_invoice_history
  for select using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists mr_select on public.markup_rules
  for select using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

-- WRITE policies
create policy if not exists suppliers_write on public.suppliers
  for all using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists supplier_invoices_write on public.supplier_invoices
  for all using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists sii_write on public.supplier_invoice_items
  for all using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists sia_write on public.supplier_invoice_allocations
  for all using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists sip_write on public.supplier_invoice_payments
  for all using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists approval_write on public.supplier_invoice_approvals
  for all using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists sih_insert on public.supplier_invoice_history
  for insert with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

create policy if not exists mr_write on public.markup_rules
  for all using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

