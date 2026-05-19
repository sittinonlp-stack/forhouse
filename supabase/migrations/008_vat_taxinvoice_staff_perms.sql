-- Migration 008: VAT inclusion flag, tax invoice URL, staff expense permission

-- 1. Add VAT inclusion flag + tax invoice URL to purchase_orders + income_records
alter table public.purchase_orders
  add column if not exists vat_included    boolean default false,
  add column if not exists tax_invoice_url text;

alter table public.income_records
  add column if not exists vat_included    boolean default false,
  add column if not exists tax_invoice_url text;

-- 2. Allow staff to mark POs as paid for non-approval kinds (material, machine, other).
--    Labor/subcontract still requires manager+ to approve and pay.
--    Existing "staff can update own draft POs" stays for backwards compat.
drop policy if exists "staff can update non-approval POs" on public.purchase_orders;
create policy "staff can update non-approval POs"
  on public.purchase_orders for update
  using (
    public.is_project_member(project_id)
    and kind in ('material', 'machine', 'other')
  );
