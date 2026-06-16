-- Phase 1 extensions: sheet metadata, question groups, sub-questions, question images

-- Sheet metadata
alter table public.sheets
  add column if not exists subject_id   uuid references public.subjects,
  add column if not exists grade_level  text,
  add column if not exists turma        text,
  add column if not exists exam_type    text check (exam_type in ('prova','lista','simulado','recuperacao')),
  add column if not exists categories   text[] not null default '{}';

-- Passage / context blocks
create table if not exists public.question_groups (
  id             uuid primary key default gen_random_uuid(),
  sheet_id       uuid references public.sheets on delete cascade not null,
  instructions   text,
  passage        text,
  passage_format text not null default 'plain',
  position       int  not null,
  created_at     timestamptz default now()
);

create index if not exists question_groups_sheet_idx on public.question_groups (sheet_id, position);

-- Attach questions to a group
alter table public.sheet_questions
  add column if not exists group_id uuid references public.question_groups on delete set null;

-- Sub-question hierarchy
alter table public.questions
  add column if not exists parent_question_id uuid references public.questions on delete cascade;

-- RLS for question_groups
alter table public.question_groups enable row level security;

create policy "question_groups_select_own" on public.question_groups for select
  using (exists (select 1 from public.sheets s
                 where s.id = question_groups.sheet_id and s.owner_id = auth.uid()));
create policy "question_groups_insert_own" on public.question_groups for insert
  with check (exists (select 1 from public.sheets s
                      where s.id = question_groups.sheet_id and s.owner_id = auth.uid()));
create policy "question_groups_update_own" on public.question_groups for update
  using (exists (select 1 from public.sheets s
                 where s.id = question_groups.sheet_id and s.owner_id = auth.uid()));
create policy "question_groups_delete_own" on public.question_groups for delete
  using (exists (select 1 from public.sheets s
                 where s.id = question_groups.sheet_id and s.owner_id = auth.uid()));

grant select, insert, update, delete on public.question_groups to authenticated;

-- Question-image storage bucket
insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do nothing;

create policy "question_images_read_all" on storage.objects
  for select using (bucket_id = 'question-images');

create policy "question_images_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'question-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "question_images_update_own" on storage.objects
  for update using (
    bucket_id = 'question-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "question_images_delete_own" on storage.objects
  for delete using (
    bucket_id = 'question-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
