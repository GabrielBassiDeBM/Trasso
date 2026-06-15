-- Exercise Sheet Platform — initial schema, RLS, and grants
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  institution text,
  locale text default 'pt-BR',
  created_at timestamptz default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email), 'pt-BR');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- subject taxonomy (Disciplina -> área/tema), BNCC-aligned
-- ---------------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.subjects on delete set null
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects not null,
  name text not null,
  bncc_code text
);

-- ---------------------------------------------------------------------------
-- questions (private to a user, OR public bank when owner_id is null)
-- ---------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users,
  statement text not null,
  statement_format text not null default 'plain',
  type text not null check (type in ('open','multiple_choice','true_false','fill_blank','matching','essay')),
  options jsonb,
  answer jsonb,
  subject_id uuid references public.subjects,
  topic_id uuid references public.topics,
  difficulty text check (difficulty in ('easy','medium','hard')),
  has_math boolean not null default false,
  source text,
  tags text[] not null default '{}',
  search tsvector,
  created_at timestamptz default now()
);

create function public.questions_search_trigger()
returns trigger
language plpgsql
as $$
begin
  new.search := to_tsvector('portuguese', coalesce(new.statement, ''));
  return new;
end;
$$;

create trigger questions_search_update
  before insert or update of statement on public.questions
  for each row execute procedure public.questions_search_trigger();

create index questions_search_idx on public.questions using gin (search);
create index questions_owner_idx on public.questions (owner_id);

-- ---------------------------------------------------------------------------
-- sheets (cover layout + page settings + ordered questions)
-- ---------------------------------------------------------------------------
create table public.sheets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft','ready')),
  page_settings jsonb not null default '{}',
  cover_layout jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sheets_set_updated_at
  before update on public.sheets
  for each row execute procedure public.set_updated_at();

create index sheets_owner_idx on public.sheets (owner_id);

-- ---------------------------------------------------------------------------
-- sheet_questions (join: which questions are on a sheet, in what order)
-- ---------------------------------------------------------------------------
create table public.sheet_questions (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid references public.sheets on delete cascade not null,
  question_id uuid references public.questions on delete set null,
  position int not null,
  points numeric,
  overrides jsonb not null default '{}'
);

create index sheet_questions_sheet_idx on public.sheet_questions (sheet_id, position);

-- ---------------------------------------------------------------------------
-- assets (files in Supabase Storage)
-- ---------------------------------------------------------------------------
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  sheet_id uuid references public.sheets on delete cascade,
  kind text not null check (kind in ('logo','screenshot','question_image','pdf')),
  storage_path text not null,
  created_at timestamptz default now()
);

create index assets_owner_idx on public.assets (owner_id);

-- ---------------------------------------------------------------------------
-- ai_usage (quota / cost control)
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  kind text not null check (kind in ('extract','generate','classify')),
  tokens_in int,
  tokens_out int,
  created_at timestamptz default now()
);

create index ai_usage_owner_idx on public.ai_usage (owner_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.sheets enable row level security;
alter table public.sheet_questions enable row level security;
alter table public.assets enable row level security;
alter table public.ai_usage enable row level security;

-- profiles: owner-only
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());
create policy "profiles_delete_own" on public.profiles for delete using (id = auth.uid());

-- subjects / topics: public read, no client writes (service role only)
create policy "subjects_read_all" on public.subjects for select using (true);
create policy "topics_read_all" on public.topics for select using (true);

-- questions: owner-only writes, read own + public bank
create policy "questions_select_own_or_public" on public.questions
  for select using (owner_id = auth.uid() or owner_id is null);
create policy "questions_insert_own" on public.questions
  for insert with check (owner_id = auth.uid());
create policy "questions_update_own" on public.questions
  for update using (owner_id = auth.uid());
create policy "questions_delete_own" on public.questions
  for delete using (owner_id = auth.uid());

-- sheets: owner-only
create policy "sheets_select_own" on public.sheets for select using (owner_id = auth.uid());
create policy "sheets_insert_own" on public.sheets for insert with check (owner_id = auth.uid());
create policy "sheets_update_own" on public.sheets for update using (owner_id = auth.uid());
create policy "sheets_delete_own" on public.sheets for delete using (owner_id = auth.uid());

-- sheet_questions: gated via parent sheet's owner
create policy "sheet_questions_select_own" on public.sheet_questions
  for select using (
    exists (select 1 from public.sheets s where s.id = sheet_questions.sheet_id and s.owner_id = auth.uid())
  );
create policy "sheet_questions_insert_own" on public.sheet_questions
  for insert with check (
    exists (select 1 from public.sheets s where s.id = sheet_questions.sheet_id and s.owner_id = auth.uid())
  );
create policy "sheet_questions_update_own" on public.sheet_questions
  for update using (
    exists (select 1 from public.sheets s where s.id = sheet_questions.sheet_id and s.owner_id = auth.uid())
  );
create policy "sheet_questions_delete_own" on public.sheet_questions
  for delete using (
    exists (select 1 from public.sheets s where s.id = sheet_questions.sheet_id and s.owner_id = auth.uid())
  );

-- assets: owner-only
create policy "assets_select_own" on public.assets for select using (owner_id = auth.uid());
create policy "assets_insert_own" on public.assets for insert with check (owner_id = auth.uid());
create policy "assets_update_own" on public.assets for update using (owner_id = auth.uid());
create policy "assets_delete_own" on public.assets for delete using (owner_id = auth.uid());

-- ai_usage: owner-only
create policy "ai_usage_select_own" on public.ai_usage for select using (owner_id = auth.uid());
create policy "ai_usage_insert_own" on public.ai_usage for insert with check (owner_id = auth.uid());
create policy "ai_usage_update_own" on public.ai_usage for update using (owner_id = auth.uid());
create policy "ai_usage_delete_own" on public.ai_usage for delete using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- PostgREST grants (required for projects created after 2026-05-30, harmless
-- on older projects: RLS still applies on top of these table-level grants)
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on
  public.profiles,
  public.sheets,
  public.sheet_questions,
  public.questions,
  public.assets,
  public.ai_usage
to authenticated;

grant select on public.subjects, public.topics to authenticated, anon;
