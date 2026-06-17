-- Replace BNCC subject taxonomy with SAT/AP STEM subjects

-- Nullify FK references in questions before deleting old topics/subjects
update public.questions
  set topic_id = null
  where topic_id in (select id from public.topics where subject_id in (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014'
  ));

update public.questions
  set subject_id = null
  where subject_id in (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014'
  );

-- Nullify FK references in sheets
update public.sheets
  set subject_id = null
  where subject_id in (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014'
  );

-- Delete old BNCC topics and subjects
delete from public.topics where subject_id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000014'
);

delete from public.subjects where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000014'
);

-- Insert SAT/AP STEM subjects
insert into public.subjects (id, name, parent_id) values
  ('10000000-0000-0000-0000-000000000001', 'SAT Math',                      null),
  ('10000000-0000-0000-0000-000000000002', 'AP Precalculus',                 null),
  ('10000000-0000-0000-0000-000000000003', 'AP Calculus AB',                 null),
  ('10000000-0000-0000-0000-000000000004', 'AP Calculus BC',                 null),
  ('10000000-0000-0000-0000-000000000005', 'AP Statistics',                  null),
  ('10000000-0000-0000-0000-000000000006', 'AP Physics 1',                   null),
  ('10000000-0000-0000-0000-000000000007', 'AP Physics 2',                   null),
  ('10000000-0000-0000-0000-000000000008', 'AP Physics C: Mechanics',        null),
  ('10000000-0000-0000-0000-000000000009', 'AP Physics C: E&M',              null),
  ('10000000-0000-0000-0000-000000000010', 'AP Chemistry',                   null),
  ('10000000-0000-0000-0000-000000000011', 'AP Biology',                     null),
  ('10000000-0000-0000-0000-000000000012', 'AP Computer Science A',          null),
  ('10000000-0000-0000-0000-000000000013', 'AP Computer Science Principles', null),
  ('10000000-0000-0000-0000-000000000014', 'AP Environmental Science',       null)
on conflict (id) do nothing;

-- Insert SAT/AP topics
insert into public.topics (subject_id, name, bncc_code) values
  -- SAT Math
  ('10000000-0000-0000-0000-000000000001', 'Heart of Algebra',                          null),
  ('10000000-0000-0000-0000-000000000001', 'Problem Solving and Data Analysis',         null),
  ('10000000-0000-0000-0000-000000000001', 'Passport to Advanced Math',                 null),
  ('10000000-0000-0000-0000-000000000001', 'Additional Topics in Math',                 null),

  -- AP Precalculus
  ('10000000-0000-0000-0000-000000000002', 'Polynomial and Rational Functions',         null),
  ('10000000-0000-0000-0000-000000000002', 'Exponential and Logarithmic Functions',     null),
  ('10000000-0000-0000-0000-000000000002', 'Trigonometric and Polar Functions',         null),
  ('10000000-0000-0000-0000-000000000002', 'Functions Involving Parameters, Vectors, and Matrices', null),

  -- AP Calculus AB
  ('10000000-0000-0000-0000-000000000003', 'Limits and Continuity',                     null),
  ('10000000-0000-0000-0000-000000000003', 'Differentiation: Definition and Fundamental Properties', null),
  ('10000000-0000-0000-0000-000000000003', 'Differentiation: Composite, Implicit, and Inverse Functions', null),
  ('10000000-0000-0000-0000-000000000003', 'Contextual Applications of Differentiation', null),
  ('10000000-0000-0000-0000-000000000003', 'Analytical Applications of Differentiation', null),
  ('10000000-0000-0000-0000-000000000003', 'Integration and Accumulation of Change',    null),
  ('10000000-0000-0000-0000-000000000003', 'Differential Equations',                   null),
  ('10000000-0000-0000-0000-000000000003', 'Applications of Integration',               null),

  -- AP Calculus BC (same units as AB plus two more)
  ('10000000-0000-0000-0000-000000000004', 'Limits and Continuity',                     null),
  ('10000000-0000-0000-0000-000000000004', 'Differentiation: Definition and Fundamental Properties', null),
  ('10000000-0000-0000-0000-000000000004', 'Differentiation: Composite, Implicit, and Inverse Functions', null),
  ('10000000-0000-0000-0000-000000000004', 'Contextual Applications of Differentiation', null),
  ('10000000-0000-0000-0000-000000000004', 'Analytical Applications of Differentiation', null),
  ('10000000-0000-0000-0000-000000000004', 'Integration and Accumulation of Change',    null),
  ('10000000-0000-0000-0000-000000000004', 'Differential Equations',                   null),
  ('10000000-0000-0000-0000-000000000004', 'Applications of Integration',               null),
  ('10000000-0000-0000-0000-000000000004', 'Parametric Equations, Polar Coordinates, and Vector-Valued Functions', null),
  ('10000000-0000-0000-0000-000000000004', 'Infinite Sequences and Series',             null),

  -- AP Statistics
  ('10000000-0000-0000-0000-000000000005', 'Exploring One-Variable Data',               null),
  ('10000000-0000-0000-0000-000000000005', 'Exploring Two-Variable Data',               null),
  ('10000000-0000-0000-0000-000000000005', 'Collecting Data',                           null),
  ('10000000-0000-0000-0000-000000000005', 'Probability, Random Variables, and Probability Distributions', null),
  ('10000000-0000-0000-0000-000000000005', 'Sampling Distributions',                    null),
  ('10000000-0000-0000-0000-000000000005', 'Inference for Categorical Data: Proportions', null),
  ('10000000-0000-0000-0000-000000000005', 'Inference for Quantitative Data: Means',    null),
  ('10000000-0000-0000-0000-000000000005', 'Inference for Categorical Data: Chi-Square', null),
  ('10000000-0000-0000-0000-000000000005', 'Inference for Quantitative Data: Slopes',   null),

  -- AP Physics 1
  ('10000000-0000-0000-0000-000000000006', 'Kinematics',                                null),
  ('10000000-0000-0000-0000-000000000006', 'Forces and Newton''s Laws of Motion',       null),
  ('10000000-0000-0000-0000-000000000006', 'Circular Motion and Gravitation',           null),
  ('10000000-0000-0000-0000-000000000006', 'Energy',                                    null),
  ('10000000-0000-0000-0000-000000000006', 'Momentum',                                  null),
  ('10000000-0000-0000-0000-000000000006', 'Simple Harmonic Motion',                    null),
  ('10000000-0000-0000-0000-000000000006', 'Torque and Rotational Motion',              null),
  ('10000000-0000-0000-0000-000000000006', 'Electric Charge and Electric Force',        null),
  ('10000000-0000-0000-0000-000000000006', 'DC Circuits',                               null),
  ('10000000-0000-0000-0000-000000000006', 'Mechanical Waves and Sound',                null),

  -- AP Physics 2
  ('10000000-0000-0000-0000-000000000007', 'Fluids',                                    null),
  ('10000000-0000-0000-0000-000000000007', 'Thermodynamics',                            null),
  ('10000000-0000-0000-0000-000000000007', 'Electric Force, Field, and Potential',      null),
  ('10000000-0000-0000-0000-000000000007', 'Electric Circuits',                         null),
  ('10000000-0000-0000-0000-000000000007', 'Magnetism and Electromagnetic Induction',   null),
  ('10000000-0000-0000-0000-000000000007', 'Geometric and Physical Optics',             null),
  ('10000000-0000-0000-0000-000000000007', 'Quantum, Atomic, and Nuclear Physics',      null),

  -- AP Physics C: Mechanics
  ('10000000-0000-0000-0000-000000000008', 'Kinematics',                                null),
  ('10000000-0000-0000-0000-000000000008', 'Newton''s Laws of Motion',                  null),
  ('10000000-0000-0000-0000-000000000008', 'Work, Energy, and Power',                   null),
  ('10000000-0000-0000-0000-000000000008', 'Systems of Particles and Linear Momentum',  null),
  ('10000000-0000-0000-0000-000000000008', 'Rotation',                                  null),
  ('10000000-0000-0000-0000-000000000008', 'Oscillations',                              null),
  ('10000000-0000-0000-0000-000000000008', 'Gravitation',                               null),

  -- AP Physics C: E&M
  ('10000000-0000-0000-0000-000000000009', 'Electrostatics',                            null),
  ('10000000-0000-0000-0000-000000000009', 'Conductors, Capacitors, and Dielectrics',   null),
  ('10000000-0000-0000-0000-000000000009', 'Electric Circuits',                         null),
  ('10000000-0000-0000-0000-000000000009', 'Magnetic Fields',                           null),
  ('10000000-0000-0000-0000-000000000009', 'Electromagnetism',                          null),

  -- AP Chemistry
  ('10000000-0000-0000-0000-000000000010', 'Atomic Structure and Properties',           null),
  ('10000000-0000-0000-0000-000000000010', 'Molecular and Ionic Compound Structure and Properties', null),
  ('10000000-0000-0000-0000-000000000010', 'Intermolecular Forces and Properties',      null),
  ('10000000-0000-0000-0000-000000000010', 'Chemical Reactions',                        null),
  ('10000000-0000-0000-0000-000000000010', 'Kinetics',                                  null),
  ('10000000-0000-0000-0000-000000000010', 'Thermodynamics',                            null),
  ('10000000-0000-0000-0000-000000000010', 'Equilibrium',                               null),
  ('10000000-0000-0000-0000-000000000010', 'Acids and Bases',                           null),
  ('10000000-0000-0000-0000-000000000010', 'Applications of Thermodynamics',            null),

  -- AP Biology
  ('10000000-0000-0000-0000-000000000011', 'Chemistry of Life',                         null),
  ('10000000-0000-0000-0000-000000000011', 'Cell Structure and Function',               null),
  ('10000000-0000-0000-0000-000000000011', 'Cellular Energetics',                       null),
  ('10000000-0000-0000-0000-000000000011', 'Cell Communication and Cell Cycle',         null),
  ('10000000-0000-0000-0000-000000000011', 'Heredity',                                  null),
  ('10000000-0000-0000-0000-000000000011', 'Gene Expression and Regulation',            null),
  ('10000000-0000-0000-0000-000000000011', 'Natural Selection',                         null),
  ('10000000-0000-0000-0000-000000000011', 'Ecology',                                   null),

  -- AP Computer Science A
  ('10000000-0000-0000-0000-000000000012', 'Primitive Types',                           null),
  ('10000000-0000-0000-0000-000000000012', 'Using Objects',                             null),
  ('10000000-0000-0000-0000-000000000012', 'Boolean Expressions and if Statements',     null),
  ('10000000-0000-0000-0000-000000000012', 'Iteration',                                 null),
  ('10000000-0000-0000-0000-000000000012', 'Writing Classes',                           null),
  ('10000000-0000-0000-0000-000000000012', 'Array',                                     null),
  ('10000000-0000-0000-0000-000000000012', 'ArrayList',                                 null),
  ('10000000-0000-0000-0000-000000000012', '2D Array',                                  null),
  ('10000000-0000-0000-0000-000000000012', 'Inheritance',                               null),
  ('10000000-0000-0000-0000-000000000012', 'Recursion',                                 null),

  -- AP Computer Science Principles
  ('10000000-0000-0000-0000-000000000013', 'Creative Development',                      null),
  ('10000000-0000-0000-0000-000000000013', 'Data',                                      null),
  ('10000000-0000-0000-0000-000000000013', 'Algorithms and Programming',                null),
  ('10000000-0000-0000-0000-000000000013', 'Computer Systems and Networks',             null),
  ('10000000-0000-0000-0000-000000000013', 'Impact of Computing',                       null),

  -- AP Environmental Science
  ('10000000-0000-0000-0000-000000000014', 'The Living World: Ecosystems',              null),
  ('10000000-0000-0000-0000-000000000014', 'The Living World: Biodiversity',            null),
  ('10000000-0000-0000-0000-000000000014', 'Populations',                               null),
  ('10000000-0000-0000-0000-000000000014', 'Earth Systems and Resources',               null),
  ('10000000-0000-0000-0000-000000000014', 'Land and Water Use',                        null),
  ('10000000-0000-0000-0000-000000000014', 'Energy Resources and Consumption',          null),
  ('10000000-0000-0000-0000-000000000014', 'Atmospheric Pollution',                     null),
  ('10000000-0000-0000-0000-000000000014', 'Aquatic and Terrestrial Pollution',         null),
  ('10000000-0000-0000-0000-000000000014', 'Global Change',                             null)
on conflict do nothing;
