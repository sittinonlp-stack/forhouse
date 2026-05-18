-- FOR HOUSE — Migration 003: Fix project creation RLS (chicken-and-egg)
-- ============================================================
-- Problem 1: INSERT projects + .select() fails because SELECT policy
--   requires is_project_member(), but user isn't yet a member at that point.
-- Problem 2: First project_members INSERT (owner) fails because
--   project_member_role() returns NULL for a brand-new project.
-- ============================================================

-- Fix 1: Allow project creator to SELECT their own project
--   (needed so .insert().select() works right after creating the project)
create policy "creator can view own project"
  on public.projects for select
  using (created_by = auth.uid());

-- Fix 2: Allow a user to add themselves as owner of a project they just created
--   (needed for the first project_members row — bootstrap case only)
create policy "creator can add themselves as owner"
  on public.project_members for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and (select created_by from public.projects where id = project_id) = auth.uid()
  );
