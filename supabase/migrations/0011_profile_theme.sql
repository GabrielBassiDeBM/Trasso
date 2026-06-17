alter table public.profiles
  add column theme text not null default 'system' check (theme in ('light', 'dark', 'system'));
