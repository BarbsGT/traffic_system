-- =============================================
-- AgencyGrid — Comprehensive Seed for Ad Agency Exercises
-- =============================================
-- INSTRUCTIONS:
-- 1. First create users in Supabase Auth Dashboard with these emails
-- 2. Run this seed AFTER migrations and AFTER users exist in auth.users
-- 3. Use the same password for all test users: Test1234!
-- =============================================

-- USERS TO CREATE IN SUPABASE AUTH DASHBOARD:
-- Go to Authentication > Users > Add User
-- Email, Password, Email confirmado: ON
--
-- SUPERADMIN:
--   ana.admin@lobueno.co / Test1234!
--   carlos.director@lobueno.co (DIRECTOR)
-- DIRECTORES:
--   maria.directora@agenciacentral.com / Test1234!
--   pedro.director@agenciadigital.mx / Test1234!
-- COLABORADORES:
--   sofia.colab@lobueno.co / Test1234!
--   ana.creativa@creativastudio.com / Test1234!
--   luis.diseno@agenciacentral.com / Test1234!
--   carmen.redaccion@agenciacentral.com / Test1234!
--   diego.data@agenciadigital.mx / Test1234!
--   valeria.social@lobueno.co / Test1234!

-- =============================================
-- PROFILES (run AFTER auth.users exist)
-- =============================================

-- We use deterministic UUIDs derived from auth.users email hash
-- In production, these are auto-created by the trigger.
-- For testing, insert manually with the IDs from auth.users.

-- To get the actual auth.users UUIDs, query: SELECT id, email FROM auth.users;
-- Then update the INSERT below with real IDs.

-- =============================================
-- AGENCIAS (advertising agencies)
-- =============================================

-- Already seeded in seed_catalogos.sql:
-- a0000000-... Agencia Central
-- a0000000-... Agencia Digital
-- a0000000-... Agencia Creativa

-- Base agencies (core Grupo Lo Bueno)
INSERT INTO agencies (id, name, code) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Agencia Central', 'AC'),
  ('a0000000-0000-0000-0000-000000000002', 'Agencia Digital', 'AD'),
  ('a0000000-0000-0000-0000-000000000003', 'Agencia Creativa', 'CR'),
  ('a0000000-0000-0000-0000-000000000010', 'Lo Bueno Publicidad', 'LBP'),
  ('a0000000-0000-0000-0000-000000000011', 'Creativa Studio MX', 'CSM')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CUENTAS (accounts/brands for ad agency)
-- =============================================

INSERT INTO accounts (id, name, agency_id, code) VALUES
  -- Agencia Central (a0000000-...-001)
  ('c0000000-0000-0000-0000-000000000010', 'Coca-Cola México', 'a0000000-0000-0000-0000-000000000001', 'CC-MX'),
  ('c0000000-0000-0000-0000-000000000011', 'Under Armour México', 'a0000000-0000-0000-0000-000000000001', 'UA-MX'),
  ('c0000000-0000-0000-0000-000000000012', 'Samsung Mobile', 'a0000000-0000-0000-0000-000000000001', 'SS-MOB'),
  -- Agencia Digital (a0000000-...-002)
  ('c0000000-0000-0000-0000-000000000013', 'Mercado Libre', 'a0000000-0000-0000-0000-000000000002', 'ML-LATAM'),
  ('c0000000-0000-0000-0000-000000000014', 'Uber Eats', 'a0000000-0000-0000-0000-000000000002', 'UB-EATS'),
  ('c0000000-0000-0000-0000-000000000015', 'Spotify Premium', 'a0000000-0000-0000-0000-000000000002', 'SP-PRE'),
  -- Agencia Creativa (a0000000-...-003)
  ('c0000000-0000-0000-0000-000000000016', 'Netflix Originals', 'a0000000-0000-0000-0000-000000000003', 'NF-ORIG'),
  ('c0000000-0000-0000-0000-000000000017', 'Apple Music', 'a0000000-0000-0000-0000-000000000003', 'AP-MUS'),
  ('c0000000-0000-0000-0000-000000000018', 'Disney+ Launch', 'a0000000-0000-0000-0000-000000000003', 'DS-LAUNCH'),
  -- Lo Bueno Publicidad (a0000000-...-010)
  ('c0000000-0000-0000-0000-000000000019', 'Grupo Modelo', 'a0000000-0000-0000-0000-000000000010', 'GM-CER'),
  ('c0000000-0000-0000-0000-000000000020', 'Bimbo Global', 'a0000000-0000-0000-0000-000000000010', 'BB-GLB'),
  -- Creativa Studio MX (a0000000-...-011)
  ('c0000000-0000-0000-0000-000000000021', 'Under Armour LatAm', 'a0000000-0000-0000-0000-000000000011', 'UA-LAT'),
  ('c0000000-0000-0000-0000-000000000022', 'Under Armour Performance', 'a0000000-0000-0000-0000-000000000011', 'UA-PRF')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- EQUIPOS (teams)
-- =============================================

INSERT INTO teams (id, name, account_id, code) VALUES
  -- Coca-Cola México
  ('e0000000-0000-0000-0000-000000000010', 'Creative Coke', 'c0000000-0000-0000-0000-000000000010', 'CC-CR'),
  ('e0000000-0000-0000-0000-000000000011', 'Media Coke', 'c0000000-0000-0000-0000-000000000010', 'CC-MD'),
  -- Under Armour México
  ('e0000000-0000-0000-0000-000000000012', 'UA Digital', 'c0000000-0000-0000-0000-000000000011', 'UA-DG'),
  -- Samsung Mobile
  ('e0000000-0000-0000-0000-000000000013', 'Samsung Ads', 'c0000000-0000-0000-0000-000000000012', 'SS-AD'),
  -- Mercado Libre
  ('e0000000-0000-0000-0000-000000000014', 'ML Performance', 'c0000000-0000-0000-0000-000000000013', 'ML-PM'),
  ('e0000000-0000-0000-0000-000000000015', 'ML Branding', 'c0000000-0000-0000-0000-000000000013', 'ML-BR'),
  -- Uber Eats
  ('e0000000-0000-0000-0000-000000000016', 'Uber Growth', 'c0000000-0000-0000-0000-000000000014', 'UB-GR'),
  -- Netflix Originals
  ('e0000000-0000-0000-0000-000000000017', 'NF Content', 'c0000000-0000-0000-0000-000000000016', 'NF-CT'),
  ('e0000000-0000-0000-0000-000000000018', 'NF Social', 'c0000000-0000-0000-0000-000000000016', 'NF-SO'),
  -- Grupo Modelo
  ('e0000000-0000-0000-0000-000000000019', 'Modelo Brands', 'c0000000-0000-0000-0000-000000000019', 'GM-BR'),
  -- Under Armour LatAm
  ('e0000000-0000-0000-0000-000000000020', 'UA Lifestyle', 'c0000000-0000-0000-0000-000000000021', 'UA-LS'),
  -- Under Armour Performance
  ('e0000000-0000-0000-0000-000000000021', 'UA Performance', 'c0000000-0000-0000-0000-000000000022', 'UA-PR')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PROJECTS (ad campaigns and initiatives)
-- =============================================

INSERT INTO projects (id, name, description, status, priority, start_date, end_date, color) VALUES
  -- Coca-Cola "Comparte una Coca-Cola" campaign
  ('f0000000-0000-0000-0000-000000000100', 'Comparte una Coca-Cola Verano', 'Campaña 360° para temporada de verano con activaciones digitales y OOH', 'IN_PROGRESS', 'HIGH', '2025-06-01', '2025-09-15', '#ED1C16'),
  ('f0000000-0000-0000-0000-000000000101', 'Coca-Cola Navidad 2025', 'Campaña navideña multicanal', 'PENDING', 'URGENT', '2025-10-01', '2025-12-31', '#ED1C16'),
  -- Under Armour "I WILL" Mexico
  ('f0000000-0000-0000-0000-000000000102', 'UA Community App', 'Lanzamiento de app para comunidad fitness', 'IN_PROGRESS', 'HIGH', '2025-05-01', '2025-08-30', '#000000'),
  ('f0000000-0000-0000-0000-000000000103', 'UA HOVR Launch', 'Campaña de lanzamiento新品 HOVR 2025', 'COMPLETED', 'MEDIUM', '2025-03-15', '2025-04-30', '#000000'),
  -- Samsung Galaxy Launch
  ('f0000000-0000-0000-0000-000000000104', 'Samsung Galaxy S25 Launch', 'Estrategia de lanzamiento para nuevo flagship', 'IN_PROGRESS', 'URGENT', '2025-07-01', '2025-10-31', '#1428A0'),
  ('f0000000-0000-0000-0000-000000000105', 'Galaxy AI Campaign', 'Campaña de adopción de funcionalidades AI', 'PENDING', 'HIGH', '2025-08-01', '2025-12-31', '#1428A0'),
  -- Mercado Libre
  ('f0000000-0000-0000-0000-000000000106', 'Hot Sale 2025', 'Campaña para el evento Hot Sale', 'IN_PROGRESS', 'URGENT', '2025-05-01', '2025-06-15', '#FFE600'),
  ('f0000000-0000-0000-0000-000000000107', 'Buen Fin 2025', 'Estrategia digital para el Buen Fin', 'PENDING', 'HIGH', '2025-10-01', '2025-11-30', '#FFE600'),
  -- Netflix
  ('f0000000-0000-0000-0000-000000000108', 'Netflix Series Promo Q3', 'Promoción de nuevas series originales', 'IN_PROGRESS', 'HIGH', '2025-06-15', '2025-09-30', '#E50914'),
  ('f0000000-0000-0000-0000-000000000109', 'Netflix Documentales', 'Campaña para contenido documental', 'PENDING', 'MEDIUM', '2025-09-01', '2025-12-31', '#E50914'),
  -- Grupo Modelo
  ('f0000000-0000-0000-0000-000000000110', 'Corona Sunset Fest', 'Festival de verano Corona', 'IN_PROGRESS', 'HIGH', '2025-06-01', '2025-08-31', '#FBBF24'),
  ('f0000000-0000-0000-0000-000000000111', 'Modelo Especial FIFA', 'Activación Mundial de Clubes', 'PENDING', 'MEDIUM', '2025-09-01', '2025-12-31', '#1E293B'),
  -- Under Armour
  ('f0000000-0000-0000-0000-000000000112', 'UA HOVR Collection Drop', 'Lanzamiento colección verano', 'COMPLETED', 'MEDIUM', '2025-04-01', '2025-06-30', '#000000')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- TASKS (individual work items)
-- =============================================

INSERT INTO tasks (id, title, description, status, priority, project_id, estimated_hours, start_date, due_date) VALUES
  -- Coca-Cola Verano
  ('f0000000-0000-0000-0000-000000000200', 'Brief creativo', 'Desarrollar brief para agencia creativa', 'COMPLETED', 'HIGH', 'f0000000-0000-0000-0000-000000000100', 8, '2025-06-01', '2025-06-05'),
  ('f0000000-0000-0000-0000-000000000201', 'Arte para redes sociales', 'Diseñar 20 assets para Instagram, TikTok, FB', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000100', 40, '2025-06-10', '2025-07-15'),
  ('f0000000-0000-0000-0000-000000000202', 'Producción spot TV', 'Grabar y editar comercial 30s', 'PENDING', 'URGENT', 'f0000000-0000-0000-0000-000000000100', 80, '2025-07-01', '2025-08-15'),
  ('f0000000-0000-0000-0000-000000000203', 'Compra de medios digitales', 'Plan de medios Meta + Google + TikTok', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000100', 24, '2025-06-15', '2025-07-30'),
  ('f0000000-0000-0000-0000-000000000204', 'Reporte semanal KPIs', 'Dashboard semanal de rendimiento', 'PENDING', 'MEDIUM', 'f0000000-0000-0000-0000-000000000100', 6, '2025-07-01', '2025-09-15'),
  -- UA Community App
  ('f0000000-0000-0000-0000-000000000205', 'Diseño UI/UX App', 'Diseñar interfaz de app fitness', 'COMPLETED', 'URGENT', 'f0000000-0000-0000-0000-000000000102', 60, '2025-05-01', '2025-06-15'),
  ('f0000000-0000-0000-0000-000000000206', 'Desarrollo iOS', 'Desarrollar app para iOS Swift', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000102', 120, '2025-06-01', '2025-08-01'),
  ('f0000000-0000-0000-0000-000000000207', 'Estrategia influencers', 'Contactar 10 fitness influencers', 'PENDING', 'MEDIUM', 'f0000000-0000-0000-0000-000000000102', 16, '2025-07-15', '2025-08-15'),
  ('f0000000-0000-0000-0000-000000000208', 'Evento lanzamiento CDMX', 'Organizar evento presencial', 'PENDING', 'HIGH', 'f0000000-0000-0000-0000-000000000102', 40, '2025-07-01', '2025-08-30'),
  -- Samsung Galaxy S25
  ('f0000000-0000-0000-0000-000000000209', 'Estrategia de contenidos', 'Plan de contenido para lanzamiento', 'COMPLETED', 'URGENT', 'f0000000-0000-0000-0000-000000000104', 20, '2025-07-01', '2025-07-15'),
  ('f0000000-0000-0000-0000-000000000210', 'Landing page producto', 'Desarrollar landing page interactiva', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000104', 40, '2025-07-15', '2025-08-15'),
  ('f0000000-0000-0000-0000-000000000211', 'Campaña email marketing', 'Secuencia de 5 emails automatizados', 'PENDING', 'MEDIUM', 'f0000000-0000-0000-0000-000000000104', 16, '2025-08-01', '2025-09-01'),
  ('f0000000-0000-0000-0000-000000000212', 'Reviewers y prensa', 'Coordinar envío de unidades a reviewers', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000104', 12, '2025-07-20', '2025-08-30'),
  -- Hot Sale 2025
  ('f0000000-0000-0000-0000-000000000213', 'Creatividades promocionales', 'Diseñar banners y ads para Hot Sale', 'COMPLETED', 'URGENT', 'f0000000-0000-0000-0000-000000000106', 30, '2025-05-01', '2025-05-20'),
  ('f0000000-0000-0000-0000-000000000214', 'Configuración Meta Ads', 'Set up de campañas en Meta Business', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000106', 10, '2025-05-15', '2025-05-25'),
  ('f0000000-0000-0000-0000-000000000215', 'Análisis post-campaña', 'Reporte de resultados Hot Sale', 'PENDING', 'MEDIUM', 'f0000000-0000-0000-0000-000000000106', 16, '2025-06-01', '2025-06-15'),
  -- Netflix Series
  ('f0000000-0000-0000-0000-000000000216', 'Arte para temporada', 'Diseñar key art para nuevas series', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000108', 50, '2025-06-15', '2025-08-01'),
  ('f0000000-0000-0000-0000-000000000217', 'Plan de social media', 'Calendario editorial para redes', 'COMPLETED', 'MEDIUM', 'f0000000-0000-0000-0000-000000000108', 12, '2025-06-15', '2025-06-30'),
  ('f0000000-0000-0000-0000-000000000218', 'Compra programática', 'Configurar campaña programática', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000108', 20, '2025-07-01', '2025-07-31'),
  -- Corona Sunset Fest
  ('f0000000-0000-0000-0000-000000000219', 'Identidad visual festival', 'Crear branding del evento', 'COMPLETED', 'HIGH', 'f0000000-0000-0000-0000-000000000110', 24, '2025-06-01', '2025-06-20'),
  ('f0000000-0000-0000-0000-000000000220', 'Activaciones digitales', 'Estrategia de ads para el festival', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000110', 32, '2025-06-20', '2025-08-01'),
  ('f0000000-0000-0000-0000-000000000221', 'Coordinación de talento', 'Gestión de artistas y performers', 'BLOCKED', 'URGENT', 'f0000000-0000-0000-0000-000000000110', 20, '2025-07-01', '2025-08-15'),
  -- UA HOVR Collection
  ('f0000000-0000-0000-0000-000000000222', 'Shoot campaign', 'Sesión fotográfica para colección', 'COMPLETED', 'HIGH', 'f0000000-0000-0000-0000-000000000112', 24, '2025-04-01', '2025-04-20'),
  ('f0000000-0000-0000-0000-000000000223', 'Lanzamiento tienda online', 'Activación digital para drop', 'COMPLETED', 'HIGH', 'f0000000-0000-0000-0000-000000000112', 32, '2025-04-20', '2025-05-15')
ON CONFLICT (id) DO NOTHING;

-- Comments are inserted in seed_test_users.sql (need real profile IDs)

-- =============================================
-- EXCEL COLUMNS (add campaign columns)
-- =============================================

INSERT INTO excel_columns (table_name, column_name, display_name, sort_order) VALUES
  ('campaigns', 'name', 'Campaña', 1),
  ('campaigns', 'platform', 'Plataforma', 2),
  ('campaigns', 'trafficker', 'Trafficker', 3),
  ('campaigns', 'start_date', 'Fecha Inicio', 4),
  ('campaigns', 'end_date', 'Fecha Fin', 5),
  ('campaigns', 'priority', 'Prioridad', 6),
  ('campaigns', 'status', 'Estado', 7),
  ('campaigns', 'roas', 'ROAS', 8),
  ('campaigns', 'cpa', 'CPA', 9)
ON CONFLICT DO NOTHING;

-- =============================================
-- INSTRUCTIONS PARA CREAR USUARIOS EN SUPABASE DASHBOARD
-- =============================================
--
-- Después de ejecutar las migrations, ve a:
-- Supabase Dashboard > Authentication > Users > Add User
--
-- Crea estos usuarios con contraseña "Test1234!" y email confirmado:
--
-- ROL: SUPERADMIN
--   ana.admin@lobueno.co
--
-- ROL: SYSADMIN
--   luis.sys@lobueno.co
--
-- ROL: DIRECTOR
--   maria.directora@agenciacentral.com
--   pedro.director@agenciadigital.mx
--   carlos.director@creativastudio.com
--
-- ROL: COLABORADOR
--   sofia.colab@lobueno.co
--   ana.creativa@creativastudio.com
--   luis.diseno@agenciacentral.com
--   carmen.redaccion@agenciacentral.com
--   diego.data@agenciadigital.mx
--   valeria.social@lobueno.co
--
-- Luego ejecuta el script SQL que asigna profiles y relaciones
-- (Ver migration_assign_users.sql)
