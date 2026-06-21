-- Data-only: strip internal import-batch tags (e.g. "manual-import",
-- "ap-chem-bio-batch-1") from existing questions. These were used to track
-- bulk-import provenance but were never meant to be user-facing tags.

update public.questions
set tags = array(
  select t from unnest(tags) as t
  where t <> 'manual-import'
    and t not like '%-batch-%'
)
where tags && array['manual-import']
   or exists (select 1 from unnest(tags) as t where t like '%-batch-%');
