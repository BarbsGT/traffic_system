-- =============================================================
-- SEED DEMO — Under Armour (3 proyectos con tareas + colaboradores)
-- -------------------------------------------------------------
-- 1) Crea 6 colaboradores demo + 1 director demo (con acceso de login, pwd Test1234!)
-- 2) Los vincula a la cuenta real Under Armour vía profile_accounts
-- 3) Crea 3 proyectos tipo 'ua_traffic' con sus tareas
--
-- Idempotente (ON CONFLICT). Aplicar en Supabase → SQL Editor UNA VEZ.
-- Borrado seguro: ejecuta supabase/delete_demo_under_armour.sql
-- =============================================================

-- CUENTA REAL: Under Armour = 5bcc5804-bbbe-4723-99a9-d3638a317e3d
-- IDs DEMO: prefijo d1e00000-... (fácil de borrar y sin tocar datos reales)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------
-- 1. CREAR USUARIOS DEMO (auth.users + profiles via trigger)
-- ---------------------------------------------------------------
DO $$
DECLARE
  _pwd TEXT := crypt('Test1234!', gen_salt('bf'));
  dir_u UUID := 'd1e00000-0000-0000-0000-0000000000d1'; -- DIRECTOR demo
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES
    (dir_u,'demo.director@lobueno.co', _pwd, now(), '{"full_name":"Director Demo"}'),
    ('d1e00000-0000-0000-0000-0000000000c1','sofia.demo@lobueno.co', _pwd, now(), '{"full_name":"Sofia Demo"}'),
    ('d1e00000-0000-0000-0000-0000000000c2','ana.demo@lobueno.co', _pwd, now(), '{"full_name":"Ana Demo"}'),
    ('d1e00000-0000-0000-0000-0000000000c3','luis.demo@lobueno.co', _pwd, now(), '{"full_name":"Luis Demo"}'),
    ('d1e00000-0000-0000-0000-0000000000c4','carmen.demo@lobueno.co', _pwd, now(), '{"full_name":"Carmen Demo"}'),
    ('d1e00000-0000-0000-0000-0000000000c5','diego.demo@lobueno.co', _pwd, now(), '{"full_name":"Diego Demo"}'),
    ('d1e00000-0000-0000-0000-0000000000c6','valeria.demo@lobueno.co', _pwd, now(), '{"full_name":"Valeria Demo"}')
  ON CONFLICT (id) DO NOTHING;

  UPDATE profiles SET role='DIRECTOR', full_name='Director Demo', position='Directora de Cuenta Demo' WHERE id = dir_u;
  UPDATE profiles SET role='COLABORADOR', full_name='Sofia Demo', position='Trafficker' WHERE id = 'd1e00000-0000-0000-0000-0000000000c1';
  UPDATE profiles SET role='COLABORADOR', full_name='Ana Demo',   position='Diseñadora'    WHERE id = 'd1e00000-0000-0000-0000-0000000000c2';
  UPDATE profiles SET role='COLABORADOR', full_name='Luis Demo',  position='UI/UX Designer' WHERE id = 'd1e00000-0000-0000-0000-0000000000c3';
  UPDATE profiles SET role='COLABORADOR', full_name='Carmen Demo', position='Redactora'     WHERE id = 'd1e00000-0000-0000-0000-0000000000c4';
  UPDATE profiles SET role='COLABORADOR', full_name='Diego Demo', position='Analista'       WHERE id = 'd1e00000-0000-0000-0000-0000000000c5';
  UPDATE profiles SET role='COLABORADOR', full_name='Valeria Demo', position='Community'    WHERE id = 'd1e00000-0000-0000-0000-0000000000c6';
END $$;

-- ---------------------------------------------------------------
-- 2. VINCULAR colaboradores + director a la cuenta Under Armour
-- ---------------------------------------------------------------
INSERT INTO profile_accounts (profile_id, account_id) VALUES
  ('d1e00000-0000-0000-0000-0000000000d1', '5bcc5804-bbbe-4723-99a9-d3638a317e3d'),
  ('d1e00000-0000-0000-0000-0000000000c1', '5bcc5804-bbbe-4723-99a9-d3638a317e3d'),
  ('d1e00000-0000-0000-0000-0000000000c2', '5bcc5804-bbbe-4723-99a9-d3638a317e3d'),
  ('d1e00000-0000-0000-0000-0000000000c3', '5bcc5804-bbbe-4723-99a9-d3638a317e3d'),
  ('d1e00000-0000-0000-0000-0000000000c4', '5bcc5804-bbbe-4723-99a9-d3638a317e3d'),
  ('d1e00000-0000-0000-0000-0000000000c5', '5bcc5804-bbbe-4723-99a9-d3638a317e3d'),
  ('d1e00000-0000-0000-0000-0000000000c6', '5bcc5804-bbbe-4723-99a9-d3638a317e3d')
ON CONFLICT (profile_id, account_id) DO NOTHING;

-- ---------------------------------------------------------------
-- 3. PROYECTOS (3 demo, cuenta Under Armour)
--    Campos completos para poblar Matriz + Dashboard ejecutivo
--    (tier, area, client_owner, budget, creative_status, fechas...)
-- ---------------------------------------------------------------
INSERT INTO projects (
  id, name, description, type, account_id, status, priority,
  start_date, end_date, owner_id, color,
  client_owner, area, tier, budget, brief_date, creative_status,
  launch_date, presentation_date, status_btlive, status_migrante, team_notes
) VALUES
  ('d1e00000-0000-0000-0000-000000000101',
   'Lanzamiento Primavera 2027',
   'Campaña integral de lanzamiento de la nueva colección Running. Incluye brand, digital y retail.',
   'ua_traffic', '5bcc5804-bbbe-4723-99a9-d3638a317e3d',
   'IN_PROGRESS', 'HIGH', '2026-08-03', '2026-08-28',
   'd1e00000-0000-0000-0000-0000000000d1', '#06b6d4',
   'Under Armour LATAM', 'Social media', 'Gold', 250000.00, '2026-08-03',
   'In Progress', '2026-08-25', '2026-08-27', 'Confirmado', 'M1', 'Demo: campaña insignia de la temporada'),
  ('d1e00000-0000-0000-0000-000000000102',
   'Campaña Deportiva "Unisport"',
   'Patrocinio y contenidos para eventos deportivos de la marca, fase de medios y activaciones.',
   'ua_traffic', '5bcc5804-bbbe-4723-99a9-d3638a317e3d',
   'IN_PROGRESS', 'MEDIUM', '2026-08-05', '2026-09-12',
   'd1e00000-0000-0000-0000-0000000000d1', '#8b5cf6',
   'Under Armour MX', 'Paid media', 'Silver', '180000.00', '2026-08-05',
   'On Hold', '2026-09-08', '2026-08-28', 'En negociación', 'Pendiente', 'Medios en espera de aprobación del cliente'),
  ('d1e00000-0000-0000-0000-000000000103',
   'Relanzamiento App UA',
   'Rediseño y relanzamiento de la app: auditoría de UX, nueva UI y comunicación de notificaciones.',
   'ua_traffic', '5bcc5804-bbbe-4723-99a9-d3638a317e3d',
   'PENDING', 'HIGH', '2026-09-01', '2026-10-15',
   'd1e00000-0000-0000-0000-0000000000d1', '#f43f5e',
   'Under Armour Digital', 'Marketing Ops', 'Bronze', '95000.00', '2026-09-01',
   'To do', '2026-10-08', '2026-09-20', 'To do', 'To do', 'Relanzamiento de producto digital')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 4. TAREAS por proyecto
--    assignee = colaborador demo | created_by = director demo
-- ---------------------------------------------------------------
INSERT INTO tasks (
  id, title, description, project_id, assignee_id, created_by,
  status, priority, start_date, due_date
) VALUES
  -- PROYECTO 101: Lanzamiento Primavera
  ('d1e00000-0000-0000-0000-000000000201',
   'Brief creativo', 'Recopilar insights de marca y definir el concepto central.',
   'd1e00000-0000-0000-0000-000000000101',
   'd1e00000-0000-0000-0000-0000000000c1', 'd1e00000-0000-0000-0000-0000000000d1',
   'IN_PROGRESS', 'HIGH', '2026-08-03', '2026-08-10'),
  ('d1e00000-0000-0000-0000-000000000202',
   'Assets visuales', 'Piezas de video y banner para redes y pre-roll.',
   'd1e00000-0000-0000-0000-000000000101',
   'd1e00000-0000-0000-0000-0000000000c2', 'd1e00000-0000-0000-0000-0000000000d1',
   'REVIEW', 'MEDIUM', '2026-08-06', '2026-08-20'),
  ('d1e00000-0000-0000-0000-000000000203',
   'Landing de campaña (UI)', 'Rediseño de la landing del lanzamiento (desktop y mobile).',
   'd1e00000-0000-0000-0000-000000000101',
   'd1e00000-0000-0000-0000-0000000000c3', 'd1e00000-0000-0000-0000-0000000000d1',
   'PENDING', 'LOW', '2026-08-20', '2026-09-01'),
  ('d1e00000-0000-0000-0000-000000000204',
   'Copy y contenidos', 'Textos para web, mail y pauta digital de la campaña.',
   'd1e00000-0000-0000-0000-000000000101',
   'd1e00000-0000-0000-0000-0000000000c4', 'd1e00000-0000-0000-0000-0000000000d1',
   'PENDING', 'MEDIUM', '2026-08-10', '2026-08-25'),

  -- PROYECTO 102: Campaña Deportiva
  ('d1e00000-0000-0000-0000-000000000211',
   'Plan de medios', 'Definir la pauta digital y el mix de medios del patrocinio.',
   'd1e00000-0000-0000-0000-000000000102',
   'd1e00000-0000-0000-0000-0000000000c5', 'd1e00000-0000-0000-0000-0000000000d1',
   'IN_PROGRESS', 'HIGH', '2026-08-05', '2026-08-18'),
  ('d1e00000-0000-0000-0000-000000000212',
   'Activación social', 'Calendar de contenidos para redes del evento.',
   'd1e00000-0000-0000-0000-000000000102',
   'd1e00000-0000-0000-0000-0000000000c6', 'd1e00000-0000-0000-0000-0000000000d1',
   'PENDING', 'MEDIUM', '2026-08-12', '2026-08-29'),
  ('d1e00000-0000-0000-0000-000000000213',
   'Spot TV/CTV', 'Spot de 30” para TV y CTV del patrocinio.',
   'd1e00000-0000-0000-0000-000000000102',
   'd1e00000-0000-0000-0000-0000000000c3', 'd1e00000-0000-0000-0000-0000000000d1',
   'BLOCKED', 'HIGH', '2026-08-08', '2026-08-22'),
  ('d1e00000-0000-0000-0000-000000000214',
   'Insights de audiencia', 'Análisis de audiencia del público objetivo.',
   'd1e00000-0000-0000-0000-000000000102',
   'd1e00000-0000-0000-0000-0000000000c4', 'd1e00000-0000-0000-0000-0000000000d1',
   'COMPLETED', 'LOW', '2026-08-05', '2026-08-12'),

  -- PROYECTO 103: Relanzamiento App UA
  ('d1e00000-0000-0000-0000-000000000301',
   'Auditoría de experiencia', 'Revisión de procesos de la app y mapa de fricciones.',
   'd1e00000-0000-0000-0000-000000000103',
   'd1e00000-0000-0000-0000-0000000000c5', 'd1e00000-0000-0000-0000-0000000000d1',
   'IN_PROGRESS', 'MEDIUM', '2026-09-01', '2026-09-15'),
  ('d1e00000-0000-0000-0000-000000000302',
   'Nuevo flujo UI', 'Prototipo de alta de onboarding y home.',
   'd1e00000-0000-0000-0000-000000000103',
   'd1e00000-0000-0000-0000-0000000000c3', 'd1e00000-0000-0000-0000-0000000000d1',
   'PENDING', 'HIGH', '2026-09-10', '2026-10-01'),
  ('d1e00000-0000-0000-0000-000000000303',
   'Comunicación push', 'Plantillas y guía de tono para notificaciones.',
   'd1e00000-0000-0000-0000-000000000103',
   'd1e00000-0000-0000-0000-0000000000c4', 'd1e00000-0000-0000-0000-0000000000d1',
   'IN_PROGRESS', 'LOW', '2026-09-15', '2026-09-28'),
  ('d1e00000-0000-0000-0000-000000000304',
   'Gestión de comunidad', 'Inbound y respuesta de comentarios para el relanzamiento.',
   'd1e00000-0000-0000-0000-000000000103',
   'd1e00000-0000-0000-0000-0000000000c6', 'd1e00000-0000-0000-0000-0000000000d1',
   'PENDING', 'MEDIUM', '2026-10-01', '2026-11-05')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- 5. COMENTARIOS de ejemplo en algunas tareas
-- ---------------------------------------------------------------
INSERT INTO comments (id, task_id, author_id, content) VALUES
  ('d1e00000-0000-0000-0000-000000000401', 'd1e00000-0000-0000-0000-000000000201',
   'd1e00000-0000-0000-0000-0000000000c1', 'El concepto queda alineado con la campaña global; falta cerrar el key visual.'),
  ('d1e00000-0000-0000-0000-000000000402', 'd1e00000-0000-0000-0000-000000000213',
   'd1e00000-0000-0000-0000-0000000000c3', 'Spot bloqueado esperando el CTA final del cliente.'),
  ('d1e00000-0000-0000-0000-000000000403', 'd1e00000-0000-0000-0000-000000000301',
   'd1e00000-0000-0000-0000-0000000000c5', 'Auditoría en curso, fricción principal detectada en onboarding.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- VERIFICACIÓN
-- ---------------------------------------------------------------
SELECT 'CUENTA' AS tipo, u.email::text AS nombre, NULL::text AS detalle
FROM auth.users u WHERE u.email LIKE '%.demo@lobueno.co'
UNION ALL
SELECT 'PROYECTO', name, status::text FROM projects
WHERE projects.id::text LIKE 'd1e00000-0000-0000-0000-0000000001%'
UNION ALL
SELECT 'TAREA', title, assignee_id::text FROM tasks
WHERE tasks.id::text LIKE 'd1e00000-0000-0000-0000-0000000002%'
   OR tasks.id::text LIKE 'd1e00000-0000-0000-0000-0000000003%';