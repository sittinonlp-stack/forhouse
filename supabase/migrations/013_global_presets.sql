-- 013_global_presets.sql
-- Add global_presets column (array of preset objects) to profiles
-- Each preset = { id, name, categories, categoryCosts }
-- Replaces the single global_categories/global_category_costs from migration 012
-- (old columns are kept for backward compat; loader auto-migrates first preset on first read)

alter table public.profiles
  add column if not exists global_presets jsonb default '[]';
