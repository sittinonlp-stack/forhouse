-- Migration 006: allow staff to create income records
-- Previously "managers+ can edit income" blocked staff from inserting.
-- Split into: staff+ can insert, managers+ can update/delete.

-- Drop the catch-all "for all" policy
drop policy if exists "managers+ can edit income" on public.income_records;

-- All project members (including staff) can add income entries
create policy "staff+ can create income"
  on public.income_records for insert
  with check (public.is_project_member(project_id));

-- Only managers+ can update existing income records
create policy "managers+ can update income"
  on public.income_records for update
  using (public.project_member_role(project_id) in ('owner','admin','manager'));

-- Only managers+ can delete income records
create policy "managers+ can delete income"
  on public.income_records for delete
  using (public.project_member_role(project_id) in ('owner','admin','manager'));
