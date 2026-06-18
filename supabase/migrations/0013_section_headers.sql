-- Section header blocks: a lightweight variant of question_groups for labeling sections
alter table public.question_groups
  add column if not exists block_type text not null default 'passage' check (block_type in ('passage','section_header')),
  add column if not exists title      text;
