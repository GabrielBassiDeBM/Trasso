-- Security fix: organization_members INSERT policy allowed any authenticated
-- user to self-insert into ANY organization with ANY role (including 'dono'),
-- since the old check was `is_org_admin(org_id) or user_id = auth.uid()` with
-- no constraint tying the row to a real invitation or to org creation.
--
-- This let any logged-in user run, from the browser console:
--   supabase.from('organization_members').insert({ org_id: '<any-org>', user_id: me, role: 'dono' })
-- and become owner of an organization they were never invited to.

drop policy if exists "org_members_insert_admin" on public.organization_members;

-- Verifies the caller holds a still-valid, pending invitation for this org
-- and role. Needs SECURITY DEFINER because authenticated/anon have no SELECT
-- grant on auth.users.
create or replace function public.has_valid_invite(o uuid, r text)
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1
    from public.invitations i
    join auth.users u on u.id = auth.uid()
    where i.org_id = o
      and i.role = r
      and i.status = 'pendente'
      and (i.expires_at is null or i.expires_at > now())
      and lower(i.email) = lower(u.email)
  );
$$;

create policy "org_members_insert_self_or_admin" on public.organization_members
  for insert with check (
    -- An existing admin/owner can add members directly.
    is_org_admin(org_id)
    -- The org creator can bootstrap themselves as the first "dono" exactly
    -- once (createOrgAction does this right after the insert into organizations).
    or (
      user_id = auth.uid()
      and role = 'dono'
      and exists (select 1 from public.organizations o where o.id = org_id and o.created_by = auth.uid())
    )
    -- Anyone else can only self-insert if they hold a matching, valid invite.
    or (
      user_id = auth.uid()
      and public.has_valid_invite(org_id, role)
    )
  );

-- 0006 never defined an UPDATE policy for organization_members, so role
-- changes (updateMemberRoleAction) silently no-op under RLS. Add one,
-- admin/owner-only, and block a member from de-admin'ing/removing the last
-- owner via this path (deletion of the last dono still goes through
-- removeMemberAction's existing self-or-admin DELETE policy).
create policy "org_members_update_admin" on public.organization_members
  for update using (is_org_admin(org_id))
  with check (is_org_admin(org_id));
