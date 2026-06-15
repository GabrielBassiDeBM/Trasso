-- Storage bucket for cover logos (Phase 2: layout editor)
-- Run this after 0001_init.sql.

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Path convention: logos/{owner_id}/{filename} — RLS keys off the first
-- folder segment so each user can only manage their own files.
create policy "logos_read_all" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos_insert_own" on storage.objects
  for insert with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos_update_own" on storage.objects
  for update using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos_delete_own" on storage.objects
  for delete using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
