-- Phase 5: Organizations, folders, multi-tenant sharing

create table if not exists public.organizations (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text unique,
  default_cover_layout jsonb,
  created_by           uuid references auth.users,
  created_at           timestamptz default now()
);

create table if not exists public.organization_members (
  org_id     uuid references public.organizations on delete cascade,
  user_id    uuid references auth.users on delete cascade,
  role       text not null default 'membro',  -- dono | admin | membro
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);

create table if not exists public.invitations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references public.organizations on delete cascade,
  email      text not null,
  role       text not null default 'membro',
  token      text unique not null,
  status     text not null default 'pendente',  -- pendente | aceito | expirado
  invited_by uuid references auth.users,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references public.organizations on delete cascade,  -- null = personal
  owner_id   uuid references auth.users,
  parent_id  uuid references public.folders on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

-- Extend sheets for org/folder
alter table public.sheets
  add column if not exists org_id       uuid references public.organizations,
  add column if not exists folder_id    uuid references public.folders on delete set null,
  add column if not exists accessibility jsonb not null default '{}';

-- Extend questions for org sharing
alter table public.questions
  add column if not exists org_id uuid references public.organizations;

-- RLS helper: check org membership
create or replace function public.is_org_member(o uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = o and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(o uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = o and m.user_id = auth.uid()
      and m.role in ('dono','admin')
  );
$$;

-- RLS for organizations
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.invitations          enable row level security;
alter table public.folders              enable row level security;

-- organizations: members can read; only dono/admin can update
create policy "orgs_select_member" on public.organizations for select
  using (is_org_member(id) or created_by = auth.uid());
create policy "orgs_insert_own" on public.organizations for insert
  with check (created_by = auth.uid());
create policy "orgs_update_admin" on public.organizations for update
  using (is_org_admin(id));
create policy "orgs_delete_dono" on public.organizations for delete
  using (exists (select 1 from public.organization_members m
                 where m.org_id = id and m.user_id = auth.uid() and m.role = 'dono'));

-- organization_members: members read their own orgs; admin manages members
create policy "org_members_select_own" on public.organization_members for select
  using (user_id = auth.uid() or is_org_member(org_id));
create policy "org_members_insert_admin" on public.organization_members for insert
  with check (is_org_admin(org_id) or user_id = auth.uid());
create policy "org_members_delete_admin" on public.organization_members for delete
  using (is_org_admin(org_id) or user_id = auth.uid());

-- invitations: admin manages; invitee can read by token
create policy "invitations_select_admin" on public.invitations for select
  using (is_org_member(org_id) or invited_by = auth.uid());
create policy "invitations_insert_admin" on public.invitations for insert
  with check (is_org_admin(org_id));
create policy "invitations_update_admin" on public.invitations for update
  using (is_org_admin(org_id) or invited_by = auth.uid());
create policy "invitations_delete_admin" on public.invitations for delete
  using (is_org_admin(org_id));

-- folders: personal = owner; org = member
create policy "folders_select_own" on public.folders for select
  using (
    (org_id is null and owner_id = auth.uid())
    or (org_id is not null and is_org_member(org_id))
  );
create policy "folders_insert_own" on public.folders for insert
  with check (
    (org_id is null and owner_id = auth.uid())
    or (org_id is not null and is_org_member(org_id))
  );
create policy "folders_update_own" on public.folders for update
  using (
    (org_id is null and owner_id = auth.uid())
    or (org_id is not null and is_org_admin(org_id))
  );
create policy "folders_delete_own" on public.folders for delete
  using (
    (org_id is null and owner_id = auth.uid())
    or (org_id is not null and is_org_admin(org_id))
  );

-- Update sheets RLS to allow org members
drop policy if exists "sheets_select_own" on public.sheets;
create policy "sheets_select_own_or_org" on public.sheets for select
  using (
    owner_id = auth.uid()
    or (org_id is not null and is_org_member(org_id))
  );

-- Update questions RLS to allow org members
drop policy if exists "questions_select_own_or_public" on public.questions;
create policy "questions_select_own_or_org_or_public" on public.questions for select
  using (
    owner_id = auth.uid()
    or owner_id is null
    or (org_id is not null and is_org_member(org_id))
  );

grant select, insert, update, delete on
  public.organizations, public.organization_members, public.invitations, public.folders
to authenticated;
