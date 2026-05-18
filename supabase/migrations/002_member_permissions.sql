-- FOR HOUSE — Migration 002: Email in profiles + member permission fixes
-- Run this in Supabase SQL Editor after 001_schema.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Add email column to profiles
-- ─────────────────────────────────────────────
alter table public.profiles add column if not exists email text;

-- Backfill email for existing users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ─────────────────────────────────────────────
-- 2. Update trigger to also store email
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    new.email,
    'staff'
  )
  on conflict (id) do update set
    email        = excluded.email,
    display_name = coalesce(excluded.display_name, profiles.display_name);
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- 3. Allow authenticated users to search profiles by email
--    (needed so executives can add members by email)
-- ─────────────────────────────────────────────
drop policy if exists "users can view own profile" on public.profiles;

create policy "authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- ─────────────────────────────────────────────
-- 4. Fix project_members INSERT policy
--    (FOR ALL with USING doesn't cover INSERT — need WITH CHECK)
-- ─────────────────────────────────────────────
drop policy if exists "owners/admins can manage members" on public.project_members;

create policy "owners/admins can insert members"
  on public.project_members for insert
  with check (public.project_member_role(project_id) in ('owner','admin'));

create policy "owners/admins can update members"
  on public.project_members for update
  using (public.project_member_role(project_id) in ('owner','admin'));

create policy "owners/admins can delete members"
  on public.project_members for delete
  using (public.project_member_role(project_id) in ('owner','admin'));
