-- Migration 007: Enable Supabase Realtime on PO + income tables
-- Run this in Supabase Dashboard → SQL Editor

-- Enable realtime publications for these two tables
alter publication supabase_realtime add table public.purchase_orders;
alter publication supabase_realtime add table public.income_records;

-- REPLICA IDENTITY FULL lets Supabase include the full old row on DELETE
-- (needed so we can remove the right record without re-fetching)
alter table public.purchase_orders replica identity full;
alter table public.income_records  replica identity full;
