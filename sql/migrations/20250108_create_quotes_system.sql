-- =========================================================
-- Quote/KMA backend – core schema + RLS + helpers (debugged)
-- =========================================================
-- Kör i Supabase SQL Editor. Idempotent där möjligt.
-- Förutsätter:
--   public.tenants(id)
--   public.clients(id)  -- kund
--   public.projects(id) -- projekt
--   public.employees(id, tenant_id, auth_user_id)
--   app.user_roles(tenant_id, user_id, role)
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- TABLE: quotes ----------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  quote_number text not null,
  version_number int not null default 1,
  title text not null,
  notes text,
  currency text not null default 'SEK',
  valid_until date,
  kma_enabled boolean not null default false,
  status text not null default 'draft'
    check (status in (
      'draft','pending_approval','approved','sent','viewed','accepted','rejected','expired','archived'
    )),
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  email_sent_count int not null default 0,
  opened_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, quote_number)
);

-- ---------- TABLE: quote_items (fixed) ----------
create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  item_type text not null default 'material' -- material|labor|other
    check (item_type in ('material','labor','other')),
  name text not null,
  description text,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'st',
  unit_price numeric(12,2) not null default 0,
  discount numeric(5,2) not null default 0, -- % av rad
  vat_rate numeric(5,2) not null default 25, -- % (SE moms default 25)
  order_index int not null default 1,
  -- line_total and discount_amount generated from base columns
  line_total numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  discount_amount numeric(14,2) generated always as (round((quantity * unit_price) * (discount/100.0), 2)) stored,
  -- net_price computed from base expressions (DO NOT reference generated columns)
  net_price numeric(14,2) generated always as (
    round(quantity * unit_price, 2)
    - round((quantity * unit_price) * (discount/100.0), 2)
  ) stored
);

-- ---------- TABLE: quote_templates ----------
create table if not exists public.quote_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  body jsonb not null default '[]'::jsonb, -- array av template-rows
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- TABLE: quote_approvals ----------
create table if not exists public.quote_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  approver_user_id uuid not null references auth.users(id) on delete cascade,
  level int not null default 1,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  reason text,
  changed_at timestamptz
);

create index if not exists idx_quote_approvals_quote on public.quote_approvals(quote_id);

-- ---------- TABLE: quote_history ----------
create table if not exists public.quote_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  event_type text not null
    check (event_type in ('created','updated','status_changed','sent','viewed','approved','rejected','duplicated','converted')),
  event_data jsonb,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_history_quote on public.quote_history(quote_id);

-- ---------- TABLE: materials ----------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sku text,
  name text not null,
  category text,
  unit text not null default 'st',
  price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

-- ---------- TABLE: pricing_rules ----------
create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  priority int not null default 100,
  -- conditions
  project_type text,
  customer_segment text,
  min_quantity numeric(12,3),
  max_quantity numeric(12,3),
  -- effect
  discount_percent numeric(6,3) default 0,
  markup_percent numeric(6,3) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index if not exists idx_quotes_tenant_status on public.quotes(tenant_id, status);
create index if not exists idx_quote_items_quote on public.quote_items(quote_id);
create index if not exists idx_pricing_rules_active on public.pricing_rules(tenant_id, active, priority);

-- ---------- TRIGGERS ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_quotes_updated_at on public.quotes;
create trigger trg_quotes_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

-- Summera totals från quote_items → quotes (vid write)
create or replace function public.recalc_quote_totals(p_quote_id uuid)
returns void language plpgsql as $$
declare
  v_tenant uuid;
  v_sub numeric(14,2);
  v_disc numeric(14,2);
  v_tax numeric(14,2);
  v_total numeric(14,2);
begin
  select q.tenant_id into v_tenant from public.quotes q where q.id = p_quote_id;
  if v_tenant is null then return; end if;

  select
    coalesce(sum(qi.line_total),0),
    coalesce(sum(qi.discount_amount),0),
    coalesce(sum( round((qi.net_price) * (qi.vat_rate/100.0), 2) ), 0)
  into v_sub, v_disc, v_tax
  from public.quote_items qi
  where qi.quote_id = p_quote_id;

  v_total := (v_sub - v_disc) + v_tax;

  update public.quotes
  set subtotal = v_sub,
      discount_amount = v_disc,
      tax_amount = v_tax,
      total_amount = v_total
  where id = p_quote_id;
end $$;

create or replace function public.on_quote_items_change()
returns trigger language plpgsql as $$
begin
  -- For DELETE triggers, use OLD; for INSERT/UPDATE use NEW. The trigger below is AFTER ... FOR EACH ROW,
  -- and we call recalc with the quote_id from NEW when available, otherwise from OLD.
  if TG_OP = 'DELETE' then
    perform public.recalc_quote_totals(old.quote_id);
  else
    perform public.recalc_quote_totals(new.quote_id);
  end if;
  return null;
end $$;

drop trigger if exists trg_quote_items_aiud on public.quote_items;
create trigger trg_quote_items_aiud
after insert or update or delete on public.quote_items
for each row
execute function public.on_quote_items_change();

-- ---------- RLS ----------
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_templates enable row level security;
alter table public.quote_approvals enable row level security;
alter table public.quote_history enable row level security;
alter table public.materials enable row level security;
alter table public.pricing_rules enable row level security;

-- Helper: check if current user belongs to tenant with a role
create or replace function app.user_in_tenant(p_tenant uuid, roles text[])
returns boolean language sql stable as $$
  select exists (
    select 1 from app.user_roles ur
    where ur.tenant_id = p_tenant
      and ur.user_id = auth.uid()
      and (roles is null or ur.role = any(roles))
  );
$$;

-- ------------------------
-- QUOTES: explicit per-op policies
-- ------------------------
drop policy if exists quotes_tenant_select on public.quotes;
create policy quotes_tenant_select
  on public.quotes
  for select
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists quotes_tenant_insert on public.quotes;
create policy quotes_tenant_insert
  on public.quotes
  for insert
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists quotes_tenant_update on public.quotes;
create policy quotes_tenant_update
  on public.quotes
  for update
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists quotes_tenant_delete on public.quotes;
create policy quotes_tenant_delete
  on public.quotes
  for delete
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

-- ------------------------
-- QUOTE_ITEMS: explicit per-op policies
-- ------------------------
drop policy if exists quote_items_select on public.quote_items;
create policy quote_items_select
  on public.quote_items
  for select
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists quote_items_insert on public.quote_items;
create policy quote_items_insert
  on public.quote_items
  for insert
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists quote_items_update on public.quote_items;
create policy quote_items_update
  on public.quote_items
  for update
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists quote_items_delete on public.quote_items;
create policy quote_items_delete
  on public.quote_items
  for delete
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

-- ------------------------
-- QUOTE_TEMPLATES: explicit per-op policies
-- ------------------------
drop policy if exists templates_select on public.quote_templates;
create policy templates_select
  on public.quote_templates
  for select
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists templates_insert on public.quote_templates;
create policy templates_insert
  on public.quote_templates
  for insert
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists templates_update on public.quote_templates;
create policy templates_update
  on public.quote_templates
  for update
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists templates_delete on public.quote_templates;
create policy templates_delete
  on public.quote_templates
  for delete
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

-- ------------------------
-- QUOTE_APPROVALS: explicit per-op policies
-- ------------------------
drop policy if exists approvals_select on public.quote_approvals;
create policy approvals_select
  on public.quote_approvals
  for select
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists approvals_insert on public.quote_approvals;
create policy approvals_insert
  on public.quote_approvals
  for insert
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists approvals_update on public.quote_approvals;
create policy approvals_update
  on public.quote_approvals
  for update
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists approvals_delete on public.quote_approvals;
create policy approvals_delete
  on public.quote_approvals
  for delete
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

-- ------------------------
-- QUOTE_HISTORY: explicit per-op policies
-- ------------------------
drop policy if exists history_select on public.quote_history;
create policy history_select
  on public.quote_history
  for select
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists history_insert on public.quote_history;
create policy history_insert
  on public.quote_history
  for insert
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists history_delete on public.quote_history;
create policy history_delete
  on public.quote_history
  for delete
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

-- ------------------------
-- MATERIALS: explicit per-op policies
-- ------------------------
drop policy if exists materials_select on public.materials;
create policy materials_select
  on public.materials
  for select
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists materials_insert on public.materials;
create policy materials_insert
  on public.materials
  for insert
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists materials_update on public.materials;
create policy materials_update
  on public.materials
  for update
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists materials_delete on public.materials;
create policy materials_delete
  on public.materials
  for delete
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

-- ------------------------
-- PRICING_RULES: explicit per-op policies
-- ------------------------
drop policy if exists rules_select on public.pricing_rules;
create policy rules_select
  on public.pricing_rules
  for select
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists rules_insert on public.pricing_rules;
create policy rules_insert
  on public.pricing_rules
  for insert
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists rules_update on public.pricing_rules;
create policy rules_update
  on public.pricing_rules
  for update
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

drop policy if exists rules_delete on public.pricing_rules;
create policy rules_delete
  on public.pricing_rules
  for delete
  using (tenant_id in (select tenant_id from app.user_roles where user_id = auth.uid()));

-- ---------- Helpers ----------
create or replace function public.generate_quote_number(p_tenant uuid)
returns text language plpgsql stable as $$
declare
  y text := to_char(current_date, 'YYYY');
  next_num int;
begin
  select coalesce(max((regexp_match(q.quote_number,'[0-9]+$'))[1]::int), 0) + 1
  into next_num
  from public.quotes q
  where q.tenant_id = p_tenant
    and q.quote_number like ('OF-'||y||'-%');

  return 'OF-'||y||'-'||lpad(next_num::text, 3, '0');
end $$;

create or replace function public.expire_old_quotes()
returns void language sql as $$
  update public.quotes
    set status='expired'
  where status in ('sent','viewed')
    and valid_until is not null
    and valid_until < current_date
    and status <> 'expired';
$$;

comment on table public.quotes is 'Offerter per tenant med totals och statusflöde';
comment on table public.quote_items is 'Radartiklar (labor/material/other) med genererade fält';

