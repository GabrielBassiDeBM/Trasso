-- Per-question passage (stimulus text) and images.
-- Passages/images ride along with the question wherever it's used (bank, sheets, print).
alter table public.questions
  add column if not exists passage text,
  add column if not exists images  text[] not null default '{}';
