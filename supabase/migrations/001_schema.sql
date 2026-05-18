-- FOR HOUSE — Initial Schema
-- Run this in Supabase SQL Editor: supabase.com → Project → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. PROFILES  (extends auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default '',
  role          text not null default 'staff'
                  check (role in ('owner','admin','manager','staff','viewer')),
  phone         text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    'staff'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- 2. PROJECTS
-- ─────────────────────────────────────────────
create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  name           text not null,
  location       text,
  client         text,
  contract_value numeric(14,2) not null default 0,
  start_date     date,
  end_date       date,
  status         text not null default 'progress'
                   check (status in ('draft','progress','complete','paused')),
  progress       numeric(4,3) default 0 check (progress between 0 and 1),
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. PROJECT MEMBERS  (access control per project)
-- ─────────────────────────────────────────────
create table public.project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'staff'
               check (role in ('owner','admin','manager','staff','viewer')),
  added_by   uuid references public.profiles(id),
  added_at   timestamptz not null default now(),
  unique (project_id, user_id)
);

create index idx_pm_user on public.project_members(user_id);
create index idx_pm_project on public.project_members(project_id);

-- ─────────────────────────────────────────────
-- 4. PROJECT BUDGETS  (one row per kind per project)
-- ─────────────────────────────────────────────
create table public.project_budgets (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind       text not null check (kind in ('material','labor','subcontract','machine','other')),
  amount     numeric(14,2) not null default 0,
  unique (project_id, kind)
);

-- ─────────────────────────────────────────────
-- 5. CATEGORIES  (custom subcategories per project/kind)
-- ─────────────────────────────────────────────
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind       text not null check (kind in ('income','material','labor','subcontract','machine','other')),
  name       text not null,
  sort_order int  not null default 0,
  unique (project_id, kind, name)
);

create index idx_cats_project on public.categories(project_id, kind);

-- ─────────────────────────────────────────────
-- 6. INCOME RECORDS  (รายรับ-งวดงาน)
-- ─────────────────────────────────────────────
create table public.income_records (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  date         date not null,
  category     text not null,
  description  text,
  amount       numeric(14,2) not null default 0,
  vat          boolean not null default false,
  vat_amount   numeric(14,2) not null default 0,
  vendor       text,
  attachment_url text,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_income_project on public.income_records(project_id, date desc);

-- ─────────────────────────────────────────────
-- 7. PURCHASE ORDERS  (ใบสั่งซื้อ - PO header)
-- ─────────────────────────────────────────────
create table public.purchase_orders (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  code             text not null,
  kind             text not null check (kind in ('material','labor','subcontract','machine','other')),
  date             date not null,
  vendor           text not null default '',
  description      text,

  -- ยอดเงิน
  subtotal         numeric(14,2) not null default 0,
  vat              boolean not null default false,
  vat_amount       numeric(14,2) not null default 0,
  withholding      numeric(5,2)  not null default 0,   -- % เช่น 3.00
  withholding_amt  numeric(14,2) not null default 0,
  retention_amount numeric(14,2) not null default 0,
  advance_deduct   numeric(14,2) not null default 0,
  amount           numeric(14,2) not null default 0,   -- ยอดสุทธิที่จ่าย

  -- Workflow:  draft → pending → approved → paid  (or rejected)
  status           text not null default 'draft'
                     check (status in ('draft','pending','approved','paid','rejected')),

  -- ขั้นตอน 1: สร้าง
  created_by       uuid references public.profiles(id),
  created_by_name  text,
  created_at       timestamptz not null default now(),
  notes            text,

  -- ขั้นตอน 2: อนุมัติ
  approved_by_name text,
  approved_at      timestamptz,
  approval_note    text,

  -- ขั้นตอน 3: จ่ายเงิน
  paid_by_name     text,
  paid_at          timestamptz,
  payment_slip_url text,

  updated_at       timestamptz not null default now(),
  unique (project_id, code)
);

create index idx_po_project on public.purchase_orders(project_id, date desc);
create index idx_po_status  on public.purchase_orders(project_id, status);

-- ─────────────────────────────────────────────
-- 8. PO ITEMS  (รายการในใบสั่งซื้อ)
-- ─────────────────────────────────────────────
create table public.po_items (
  id          uuid primary key default gen_random_uuid(),
  po_id       uuid not null references public.purchase_orders(id) on delete cascade,
  category    text not null,
  description text not null,
  qty         numeric(10,3) not null default 1,
  unit        text not null default 'รายการ',
  unit_price  numeric(14,2) not null default 0,
  amount      numeric(14,2) not null default 0,   -- qty * unit_price (computed by app)
  sort_order  int  not null default 0
);

create index idx_poi_po on public.po_items(po_id, sort_order);

-- ─────────────────────────────────────────────
-- 9. PO DEPOSITS  (เงินวางประกัน subcontract)
-- ─────────────────────────────────────────────
create table public.po_deposits (
  id              uuid primary key default gen_random_uuid(),
  po_id           uuid not null references public.purchase_orders(id) on delete cascade,
  amount          numeric(14,2) not null default 0,
  note            text,
  status          text not null default 'held' check (status in ('held','returned')),
  returned_date   date,
  return_slip_url text,
  unique (po_id)
);

-- ─────────────────────────────────────────────
-- 10. ATTACHMENTS  (polymorphic file store)
-- ─────────────────────────────────────────────
create table public.attachments (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('income','purchase_order')),
  entity_id   uuid not null,
  file_name   text not null,
  file_url    text not null,
  file_size   int,
  mime_type   text,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

create index idx_att_entity on public.attachments(entity_type, entity_id);

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════

alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.project_budgets enable row level security;
alter table public.categories      enable row level security;
alter table public.income_records  enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.po_items        enable row level security;
alter table public.po_deposits     enable row level security;
alter table public.attachments     enable row level security;

-- ── Helper functions ─────────────────────────────────

create or replace function public.is_project_member(pid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.project_members
    where project_id = pid and user_id = auth.uid()
  )
$$;

create or replace function public.project_member_role(pid uuid)
returns text language sql security definer stable as $$
  select role from public.project_members
  where project_id = pid and user_id = auth.uid()
  limit 1
$$;

-- ── Profiles ─────────────────────────────────────────

create policy "users can view own profile"
  on public.profiles for select using (id = auth.uid());

create policy "users can update own profile"
  on public.profiles for update using (id = auth.uid());

-- ── Projects ─────────────────────────────────────────

create policy "members can view project"
  on public.projects for select
  using (public.is_project_member(id));

create policy "authenticated can create project"
  on public.projects for insert
  with check (auth.uid() is not null);

create policy "managers+ can update project"
  on public.projects for update
  using (public.project_member_role(id) in ('owner','admin','manager'));

-- ── Project Members ───────────────────────────────────

create policy "members can view project_members"
  on public.project_members for select
  using (public.is_project_member(project_id));

create policy "owners/admins can manage members"
  on public.project_members for all
  using (public.project_member_role(project_id) in ('owner','admin'));

-- ── Budgets ───────────────────────────────────────────

create policy "members can view budgets"
  on public.project_budgets for select
  using (public.is_project_member(project_id));

create policy "managers+ can edit budgets"
  on public.project_budgets for all
  using (public.project_member_role(project_id) in ('owner','admin','manager'));

-- ── Categories ────────────────────────────────────────

create policy "members can view categories"
  on public.categories for select
  using (public.is_project_member(project_id));

create policy "managers+ can edit categories"
  on public.categories for all
  using (public.project_member_role(project_id) in ('owner','admin','manager'));

-- ── Income Records ────────────────────────────────────

create policy "members can view income"
  on public.income_records for select
  using (public.is_project_member(project_id));

create policy "managers+ can edit income"
  on public.income_records for all
  using (public.project_member_role(project_id) in ('owner','admin','manager'));

-- ── Purchase Orders ───────────────────────────────────

create policy "members can view POs"
  on public.purchase_orders for select
  using (public.is_project_member(project_id));

create policy "staff+ can create/edit draft POs"
  on public.purchase_orders for insert
  with check (public.is_project_member(project_id));

create policy "staff can update own draft POs"
  on public.purchase_orders for update
  using (
    public.is_project_member(project_id)
    and (
      -- staff can only edit draft/pending POs they created
      created_by = auth.uid()
      -- managers+ can edit any PO
      or public.project_member_role(project_id) in ('owner','admin','manager')
    )
  );

create policy "managers+ can delete POs"
  on public.purchase_orders for delete
  using (public.project_member_role(project_id) in ('owner','admin','manager'));

-- ── PO Items ─────────────────────────────────────────

create policy "members can view po_items"
  on public.po_items for select
  using (exists (
    select 1 from public.purchase_orders po
    where po.id = po_id and public.is_project_member(po.project_id)
  ));

create policy "staff+ can manage po_items"
  on public.po_items for all
  using (exists (
    select 1 from public.purchase_orders po
    where po.id = po_id and public.is_project_member(po.project_id)
  ));

-- ── PO Deposits ───────────────────────────────────────

create policy "members can view po_deposits"
  on public.po_deposits for select
  using (exists (
    select 1 from public.purchase_orders po
    where po.id = po_id and public.is_project_member(po.project_id)
  ));

create policy "managers+ can manage deposits"
  on public.po_deposits for all
  using (exists (
    select 1 from public.purchase_orders po
    join public.project_members pm on pm.project_id = po.project_id
    where po.id = po_id and pm.user_id = auth.uid()
      and pm.role in ('owner','admin','manager')
  ));

-- ── Attachments ───────────────────────────────────────

create policy "members can view attachments"
  on public.attachments for select
  using (
    -- income attachments
    (entity_type = 'income' and exists (
      select 1 from public.income_records ir
      where ir.id = entity_id and public.is_project_member(ir.project_id)
    ))
    or
    -- PO attachments
    (entity_type = 'purchase_order' and exists (
      select 1 from public.purchase_orders po
      where po.id = entity_id and public.is_project_member(po.project_id)
    ))
  );

create policy "staff+ can upload attachments"
  on public.attachments for insert
  with check (auth.uid() is not null);

-- ═══════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- (Run these separately in Supabase Dashboard → Storage)
-- ═══════════════════════════════════════════════════════
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);
-- insert into storage.buckets (id, name, public) values ('payment-slips', 'payment-slips', false);
-- insert into storage.buckets (id, name, public) values ('project-docs', 'project-docs', false);
