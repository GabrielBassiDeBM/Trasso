-- Add SAT Reading & Writing subject and topics

insert into public.subjects (id, name, parent_id) values
  ('10000000-0000-0000-0000-000000000015', 'SAT Reading & Writing', null)
on conflict (id) do nothing;

insert into public.topics (subject_id, name, bncc_code) values
  ('10000000-0000-0000-0000-000000000015', 'Information and Ideas',          null),
  ('10000000-0000-0000-0000-000000000015', 'Craft and Structure',            null),
  ('10000000-0000-0000-0000-000000000015', 'Expression of Ideas',            null),
  ('10000000-0000-0000-0000-000000000015', 'Standard English Conventions',   null)
on conflict do nothing;
