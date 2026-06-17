-- Data-only: solution storage for bulk-imported questions (SAT/AP bank).
-- No platform UI reads/writes these columns yet.

alter table public.questions
  add column if not exists solution        text,
  add column if not exists solution_format text not null default 'plain'
    check (solution_format in ('plain','latex','markdown'));
