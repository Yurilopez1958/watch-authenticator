-- =====================================================================
-- Initial seed: Rolex brand, models, materials and reference profiles
-- Mirrors the data in the @watch-auth/core/data package
-- =====================================================================

-- Brand
insert into brands (id, name, country, founded_year) values
  ('rolex', 'Rolex', 'Switzerland', 1905)
on conflict (id) do nothing;

-- Models
insert into models (id, brand_id, name, reference, year_start, year_end, caliber, case_diameter_mm) values
  ('rolex-submariner-date-126610ln', 'rolex', 'Submariner Date',           '126610LN',    2020, null, 'Cal. 3235', 41),
  ('rolex-submariner-date-116610ln', 'rolex', 'Submariner Date',           '116610LN',    2010, 2020, 'Cal. 3135', 40),
  ('rolex-gmt-master-ii-126710blro', 'rolex', 'GMT-Master II "Pepsi"',     '126710BLRO',  2018, null, 'Cal. 3285', 40),
  ('rolex-daytona-116500ln',         'rolex', 'Cosmograph Daytona',        '116500LN',    2016, 2023, 'Cal. 4130', 40),
  ('rolex-daytona-126500ln',         'rolex', 'Cosmograph Daytona',        '126500LN',    2023, null, 'Cal. 4131', 40),
  ('rolex-datejust-126334',          'rolex', 'Datejust 41',               '126334',      2016, null, 'Cal. 3235', 41),
  ('rolex-day-date-228238',          'rolex', 'Day-Date 40 (yellow gold)', '228238',      2015, null, 'Cal. 3255', 40),
  ('rolex-day-date-228206',          'rolex', 'Day-Date 40 (platinum)',    '228206',      2015, null, 'Cal. 3255', 40),
  ('rolex-explorer-ii-226570',       'rolex', 'Explorer II',               '226570',      2021, null, 'Cal. 3285', 42)
on conflict (id) do nothing;

-- Materials
insert into materials (id, name, kind, description) values
  ('rolex-904l-oystersteel',     '904L Oystersteel',           'steel',    'Super-austenitic stainless steel UNS N08904. Rolex has called it Oystersteel since 2018. Sea-Dweller from 1985; most lines by 2003.'),
  ('rolex-316l-pre-904l',        '316L (Rolex pre-904L)',      'steel',    'AISI 316L stainless steel used by Rolex before the transition to 904L.'),
  ('rolex-18k-yellow-gold',      'Rolex 18k Yellow Gold',      'gold',     'Alloy of 750‰ gold with silver and copper. In-house foundry since 2005.'),
  ('rolex-18k-white-gold',       'Rolex 18k White Gold',       'gold',     'Alloy of 750‰ gold with palladium (no nickel). Rolex avoids nickel to reduce allergies.'),
  ('rolex-18k-everose-gold',     'Rolex 18k Everose Gold',     'gold',     'Proprietary rose alloy patented by Rolex in 2005. Contains platinum to keep the pink color stable over time.'),
  ('rolex-950-platinum',         'Rolex 950 Platinum',         'platinum', '950‰ platinum alloy with ruthenium for hardness.')
on conflict (id) do nothing;

-- Reference profiles
insert into reference_profiles (id, material_id, brand_id, model_id, year_start, year_end, source, notes) values
  ('ref-rolex-904l',          'rolex-904l-oystersteel',  'rolex', null, 1985, null, 'public', 'UNS N08904 / EN 1.4539. Typical published spec ranges.'),
  ('ref-rolex-316l',          'rolex-316l-pre-904l',     'rolex', null, 1950, 2003, 'public', 'AISI 316L. Pre-904L transition.'),
  ('ref-rolex-18k-yellow',    'rolex-18k-yellow-gold',   'rolex', null, 1950, null, 'public', '750‰ Au with Ag and Cu.'),
  ('ref-rolex-18k-white',     'rolex-18k-white-gold',    'rolex', null, 1950, null, 'public', 'Rolex uses palladium instead of nickel.'),
  ('ref-rolex-everose',       'rolex-18k-everose-gold',  'rolex', null, 2005, null, 'public', 'Patented alloy with a small platinum content.'),
  ('ref-rolex-950-pt',        'rolex-950-platinum',      'rolex', null, 1950, null, 'public', '950‰ platinum with 50‰ ruthenium.')
on conflict (id) do nothing;

-- Elements per profile
insert into reference_profile_elements (profile_id, element, min_pct, max_pct, tolerance_abs, is_critical) values
  -- 904L
  ('ref-rolex-904l', 'Fe', 42, 50, 1.0, true),
  ('ref-rolex-904l', 'Cr', 19, 23, 0.5, true),
  ('ref-rolex-904l', 'Ni', 23, 28, 0.5, true),
  ('ref-rolex-904l', 'Mo', 4.0, 5.0, 0.3, true),
  ('ref-rolex-904l', 'Cu', 1.0, 2.0, 0.2, false),
  ('ref-rolex-904l', 'Mn', 0, 2.0, 0.2, false),
  ('ref-rolex-904l', 'Si', 0, 1.0, 0.2, false),
  -- 316L
  ('ref-rolex-316l', 'Fe', 60, 70, 1.0, true),
  ('ref-rolex-316l', 'Cr', 16, 18, 0.5, true),
  ('ref-rolex-316l', 'Ni', 10, 14, 0.5, true),
  ('ref-rolex-316l', 'Mo', 2.0, 3.0, 0.3, true),
  ('ref-rolex-316l', 'Mn', 0, 2.0, 0.2, false),
  ('ref-rolex-316l', 'Si', 0, 1.0, 0.2, false),
  -- 18k yellow
  ('ref-rolex-18k-yellow', 'Au', 74.5, 76.0, 0.3, true),
  ('ref-rolex-18k-yellow', 'Ag',  9,   16,   0.5, false),
  ('ref-rolex-18k-yellow', 'Cu',  9,   16,   0.5, false),
  -- 18k white
  ('ref-rolex-18k-white',  'Au', 74.5, 76.0, 0.3, true),
  ('ref-rolex-18k-white',  'Pd', 12,   20,   0.5, true),
  ('ref-rolex-18k-white',  'Cu',  3,   10,   0.5, false),
  ('ref-rolex-18k-white',  'Ag',  0,    4,   0.3, false),
  ('ref-rolex-18k-white',  'Ni',  0,    0.2, 0.1, true),
  -- Everose
  ('ref-rolex-everose',    'Au', 74.5, 76.0, 0.3, true),
  ('ref-rolex-everose',    'Cu', 20,   24,   0.5, true),
  ('ref-rolex-everose',    'Pt',  1.5,  3.5, 0.3, true),
  ('ref-rolex-everose',    'Ag',  0,    1.5, 0.2, false),
  -- 950 Pt
  ('ref-rolex-950-pt',     'Pt', 94.5, 95.5, 0.3, true),
  ('ref-rolex-950-pt',     'Ru',  4.5,  5.5, 0.3, true)
on conflict (profile_id, element) do nothing;
