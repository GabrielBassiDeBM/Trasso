alter table public.sheets
  add column subject_ids uuid[] not null default '{}',
  add column topic_ids uuid[] not null default '{}',
  add column difficulty text check (difficulty in ('easy','medium','hard'));
