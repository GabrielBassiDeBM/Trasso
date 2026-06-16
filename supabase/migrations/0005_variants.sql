-- Phase 4: Variants, answer cards, class rosters, exam results

create table if not exists public.sheet_variants (
  id          uuid primary key default gen_random_uuid(),
  sheet_id    uuid references public.sheets on delete cascade not null,
  label       text not null,
  seed        int  not null,
  answer_key  jsonb not null default '{}',
  created_at  timestamptz default now()
);

create index if not exists sheet_variants_sheet_idx on public.sheet_variants (sheet_id);

create table if not exists public.class_rosters (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users not null,
  turma       text not null,
  students    jsonb not null default '[]',  -- [{name, registry_no}]
  created_at  timestamptz default now()
);

create table if not exists public.exam_results (
  id            uuid primary key default gen_random_uuid(),
  sheet_id      uuid references public.sheets on delete cascade not null,
  variant_id    uuid references public.sheet_variants on delete set null,
  student_name  text,
  registry_no   text,
  answers       jsonb,
  score         numeric,
  per_question  jsonb,
  graded_at     timestamptz default now()
);

create index if not exists exam_results_sheet_idx on public.exam_results (sheet_id);

-- RLS
alter table public.sheet_variants enable row level security;
alter table public.class_rosters  enable row level security;
alter table public.exam_results   enable row level security;

create policy "sheet_variants_own" on public.sheet_variants for all
  using (exists (select 1 from public.sheets s
                 where s.id = sheet_variants.sheet_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.sheets s
                      where s.id = sheet_variants.sheet_id and s.owner_id = auth.uid()));

create policy "class_rosters_own" on public.class_rosters for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "exam_results_own" on public.exam_results for all
  using (exists (select 1 from public.sheets s
                 where s.id = exam_results.sheet_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.sheets s
                      where s.id = exam_results.sheet_id and s.owner_id = auth.uid()));

grant select, insert, update, delete on
  public.sheet_variants, public.class_rosters, public.exam_results
to authenticated;
