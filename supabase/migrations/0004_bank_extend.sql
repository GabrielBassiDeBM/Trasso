-- Phase 3: Question bank extensions — BNCC taxonomy, adaptadas, FTS, seed data

-- Extend questions for bank features
alter table public.questions
  add column if not exists bncc_code        text,
  add column if not exists is_adapted       boolean not null default false,
  add column if not exists adaptation_type  text check (adaptation_type in ('dislexia','baixa_visao','linguagem_simples','ampliada')),
  add column if not exists adapted_from     uuid references public.questions on delete set null;

-- Seed BNCC subject taxonomy
insert into public.subjects (id, name, parent_id) values
  ('00000000-0000-0000-0000-000000000001', 'Matemática',    null),
  ('00000000-0000-0000-0000-000000000002', 'Língua Portuguesa', null),
  ('00000000-0000-0000-0000-000000000003', 'Ciências',      null),
  ('00000000-0000-0000-0000-000000000004', 'História',      null),
  ('00000000-0000-0000-0000-000000000005', 'Geografia',     null),
  ('00000000-0000-0000-0000-000000000006', 'Ciências da Natureza', null),
  ('00000000-0000-0000-0000-000000000007', 'Biologia',      null),
  ('00000000-0000-0000-0000-000000000008', 'Química',       null),
  ('00000000-0000-0000-0000-000000000009', 'Física',        null),
  ('00000000-0000-0000-0000-000000000010', 'Inglês',        null),
  ('00000000-0000-0000-0000-000000000011', 'Educação Física', null),
  ('00000000-0000-0000-0000-000000000012', 'Arte',          null),
  ('00000000-0000-0000-0000-000000000013', 'Filosofia',     null),
  ('00000000-0000-0000-0000-000000000014', 'Sociologia',    null)
on conflict (id) do nothing;

-- Seed topics for core subjects
insert into public.topics (subject_id, name, bncc_code) values
  -- Matemática
  ('00000000-0000-0000-0000-000000000001', 'Números e Operações', 'EF06MA01'),
  ('00000000-0000-0000-0000-000000000001', 'Álgebra', 'EF07MA13'),
  ('00000000-0000-0000-0000-000000000001', 'Geometria', 'EF06MA20'),
  ('00000000-0000-0000-0000-000000000001', 'Grandezas e Medidas', 'EF06MA27'),
  ('00000000-0000-0000-0000-000000000001', 'Probabilidade e Estatística', 'EF06MA31'),
  ('00000000-0000-0000-0000-000000000001', 'Funções', 'EM13MAT301'),
  ('00000000-0000-0000-0000-000000000001', 'Equações e Inequações', 'EM13MAT302'),
  -- Língua Portuguesa
  ('00000000-0000-0000-0000-000000000002', 'Leitura e Compreensão Textual', 'EF69LP44'),
  ('00000000-0000-0000-0000-000000000002', 'Produção de Texto', 'EF06LP06'),
  ('00000000-0000-0000-0000-000000000002', 'Gramática e Língua', 'EF06LP14'),
  ('00000000-0000-0000-0000-000000000002', 'Literatura', 'EM13LP30'),
  -- Ciências
  ('00000000-0000-0000-0000-000000000003', 'Matéria e Energia', 'EF06CI01'),
  ('00000000-0000-0000-0000-000000000003', 'Vida e Evolução', 'EF06CI05'),
  ('00000000-0000-0000-0000-000000000003', 'Terra e Universo', 'EF06CI14'),
  -- Biologia
  ('00000000-0000-0000-0000-000000000007', 'Citologia', 'EM13CNT201'),
  ('00000000-0000-0000-0000-000000000007', 'Genética', 'EM13CNT207'),
  ('00000000-0000-0000-0000-000000000007', 'Ecologia', 'EM13CNT208'),
  ('00000000-0000-0000-0000-000000000007', 'Evolução', 'EM13CNT209'),
  -- Química
  ('00000000-0000-0000-0000-000000000008', 'Estrutura Atômica', 'EM13CNT101'),
  ('00000000-0000-0000-0000-000000000008', 'Ligações Químicas', 'EM13CNT102'),
  ('00000000-0000-0000-0000-000000000008', 'Reações Químicas', 'EM13CNT103'),
  -- Física
  ('00000000-0000-0000-0000-000000000009', 'Mecânica', 'EM13CNT302'),
  ('00000000-0000-0000-0000-000000000009', 'Termologia', 'EM13CNT303'),
  ('00000000-0000-0000-0000-000000000009', 'Ondulatória e Óptica', 'EM13CNT304'),
  ('00000000-0000-0000-0000-000000000009', 'Eletromagnetismo', 'EM13CNT305'),
  -- História
  ('00000000-0000-0000-0000-000000000004', 'Mundo Antigo', 'EF06HI01'),
  ('00000000-0000-0000-0000-000000000004', 'Brasil Colonial', 'EF07HI17'),
  ('00000000-0000-0000-0000-000000000004', 'Brasil Imperial', 'EF08HI09'),
  ('00000000-0000-0000-0000-000000000004', 'Brasil República', 'EF09HI03'),
  -- Geografia
  ('00000000-0000-0000-0000-000000000005', 'Espaço e Cartografia', 'EF06GE01'),
  ('00000000-0000-0000-0000-000000000005', 'Natureza e Clima', 'EF06GE08'),
  ('00000000-0000-0000-0000-000000000005', 'Geopolítica', 'EF09GE03')
on conflict do nothing;
