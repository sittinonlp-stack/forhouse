-- Add workers JSONB column to projects for field workers (ทีมงานภาคสนาม)
-- These are on-site workers/contractors, separate from project_members (system users)
alter table public.projects
  add column if not exists workers jsonb default '[]';
