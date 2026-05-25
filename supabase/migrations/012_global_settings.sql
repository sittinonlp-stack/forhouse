-- 012_global_settings.sql
-- Add global workers & categories columns to profiles
-- These are stored as JSONB on the user profile and shared across all projects

alter table public.profiles
  add column if not exists global_workers        jsonb default '[]',
  add column if not exists global_categories     jsonb default '{}',
  add column if not exists global_category_costs jsonb default '{}';
