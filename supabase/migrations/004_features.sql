-- FOR HOUSE — Migration 004: Schema for additional features
-- ============================================================
-- - Cost price per category (for profit/loss per category)
-- - DELETE policy for projects (executives only)
-- - Images JSON array on purchase_orders (max 10 enforced in app)
-- - DELETE policy for attachments
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Cost price per category
-- ─────────────────────────────────────────────
alter table public.categories add column if not exists cost_price numeric(14,2) not null default 0;

-- ─────────────────────────────────────────────
-- 2. Allow executives (owner/admin) to delete projects
-- ─────────────────────────────────────────────
drop policy if exists "owners/admins can delete project" on public.projects;
create policy "owners/admins can delete project"
  on public.projects for delete
  using (public.project_member_role(id) in ('owner','admin'));

-- ─────────────────────────────────────────────
-- 3. PO images stored as JSONB array
--    Format: [{ url: text, name: text, size: int, mime: text }]
-- ─────────────────────────────────────────────
alter table public.purchase_orders add column if not exists images jsonb not null default '[]'::jsonb;

-- ─────────────────────────────────────────────
-- 4. Allow uploaders / managers to delete attachments
-- ─────────────────────────────────────────────
drop policy if exists "members can delete attachments" on public.attachments;
create policy "members can delete attachments"
  on public.attachments for delete
  using (
    uploaded_by = auth.uid()
    or (entity_type = 'purchase_order' and exists (
      select 1 from public.purchase_orders po
      where po.id = entity_id and public.project_member_role(po.project_id) in ('owner','admin','manager')
    ))
    or (entity_type = 'income' and exists (
      select 1 from public.income_records ir
      where ir.id = entity_id and public.project_member_role(ir.project_id) in ('owner','admin','manager')
    ))
  );
