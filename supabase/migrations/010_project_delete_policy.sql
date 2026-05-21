-- Allow owners/admins to delete projects (and cascade to all related tables)
create policy "owners/admins can delete project"
  on public.projects for delete
  using (public.project_member_role(id) in ('owner', 'admin'));
