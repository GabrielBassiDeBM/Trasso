-- Section headers can now be nested: level 1 (e.g. subject) or level 2 (e.g. topic, sub-section)
alter table public.question_groups
  add column if not exists level smallint not null default 1 check (level in (1,2));
