-- FOR HOUSE — Migration 005: Persist PO deposit data
-- ============================================================
-- PO deposit (เงินประกันสินค้า/เครื่องจักร) stored as JSONB
--   Format: { amount: number, note: text, status: 'pending'|'returned',
--             returnedDate: text|null, returnSlip: text|null }
-- ============================================================

alter table public.purchase_orders
  add column if not exists deposit jsonb;
