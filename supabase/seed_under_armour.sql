-- Seed: Multi-Account Traffic Projects (Unified)
-- Inserts in projects + tasks tables with type='ua_traffic'
-- Ejecutar en el Editor SQL de Supabase, después de migration_unify_projects.sql

-- Asegurar cuenta demo
INSERT INTO accounts (id, agency_id, name)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-111111111111', (SELECT id FROM agencies LIMIT 1), 'Under Armour')
ON CONFLICT (id) DO NOTHING;

-- Limpiar datos previos
DELETE FROM projects WHERE account_id = 'a1b2c3d4-e5f6-7890-abcd-111111111111' AND type = 'ua_traffic';

-- ========== UNDER ARMOUR (12 proyectos) ==========
INSERT INTO projects (
  account_id, type, name, client_owner, area, tier, budget, brief_date, resp_bt,
  working_days, launch_date, presentation_date, creative_status, status_btlive,
  status_migrante, brief_link, decks_link, team_notes
) VALUES
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_Flare Sneaker Fever',               'Diego',       'Special Projects', 'Silver', 70000.00,  '2026-05-18', 'Dani Rodriguez', 32, '2026-07-04', '2026-07-06', 'Approved',      '-',   '-',       'Brief FW', 'FLARE', ''),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_HB/Tini',                            'Meli/Diego',  'Special Projects', 'Gold',   150000.00, '2026-06-02', 'Lu Tejada',     29, '2026-09-10', '2026-07-06', 'On Hold',       '-',   'On Hold', 'FW26_HB/Tini', 'Equipo Lu/Tuf', ''),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_Maratón CDMX',                       'Diego',       'Special Projects', 'Silver', 50000.00,  '2026-05-18', 'Manu Granados', 46, '2026-08-31', '2026-07-06', 'Pending Client','-',   '-',       'Brief FW', 'MEDIA MARATÓN', 'Manu/Marcos'),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_NFL México',                         'Diego',       'Special Projects', 'Silver', 100000.00, '2026-06-25', 'Lu Tejada',     8,  '2026-11-22', '2026-07-06', 'Pending Client','To do','-',  'Brief FW', 'NFL MÉXICO',    '2 ideas puntuales, una con drones'),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_Social Latam - Flare',                'Jorge',       'Social media',     'Bronze', 0.00,       '2026-05-28', 'Vale Nieto',    18, '2026-07-04', NULL,           'Approved',      '-',   '-',       'Brief',    'Plan Flare',    ''),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'Flash Sale 1 - (19 assets, 1 editable)',   'Cami',        'Paid media',       'Bronze', 0.00,       '2026-06-22', 'Harold Pinilla',4,  '2026-06-29', NULL,           'Approved',      '-',   '-',       'Link assets', 'Assets ya entregados', ''),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_UA Run CDMX',                        'Diego',       'Special Projects', 'Gold',   120000.00, '2026-05-10', 'Dani Rodriguez',36, '2026-08-15', '2026-07-10', 'In Progress',   '-',   '-',       'Brief FW', 'UA RUN CDMX',   'Coordinación con logística'),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_Launch Week UA',                     'Meli',        'Special Projects', 'Gold',   200000.00, '2026-06-01', 'Lu Tejada',     44, '2026-09-01', '2026-07-15', 'On Hold',       '-',   '-',       'Brief FW', 'LAUNCH WEEK',   'Esperando brief final'),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'Flash Sale 2 - Display Ads',              'Cami',        'Paid media',       'Bronze', 0.00,       '2026-07-06', 'Harold Pinilla',4,  '2026-07-13', NULL,           'To do',         '-',   '-',       'Link assets', '',              ''),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_Social Latam - HB/Tini',            'Jorge',       'Social media',     'Silver', 30000.00,  '2026-06-08', 'Vale Nieto',    22, '2026-07-11', NULL,           'Approved',      '-',   '-',       'Brief',    'Social HB/Tini',''),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_Retail Assets Latam',                'Diego',       'Marketing Ops',    'Silver', 45000.00,  '2026-06-15', 'Manu Granados', 30, '2026-08-01', '2026-07-18', 'Pending Client','-',   '-',       'Brief FW', 'RETAIL',        'Traducciones pendientes'),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'Flash Sale 3 - Social Proof Ads',         'Cami',        'Paid media',       'Bronze', 0.00,       '2026-07-13', 'Harold Pinilla',4,  '2026-07-20', NULL,           'Send',          '-',   '-',       'Link assets', '',              ''),
('a1b2c3d4-e5f6-7890-abcd-111111111111', 'ua_traffic', 'FW26_Social Latam - NFL México',          'Jorge',       'Social media',     'Bronze', 0.00,       '2026-07-01', 'Vale Nieto',    14, '2026-07-25', NULL,           'Pending Client','-',   '-',       'Brief',    'Social NFL',    '');
