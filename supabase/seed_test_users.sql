-- =============================================
-- AgencyGrid — Create test users + assign data
-- Run AFTER migration_all.sql completes.
-- =============================================
-- All users get password: Test1234!
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  _pwd TEXT := crypt('Test1234!', gen_salt('bf'));
  uid UUID;
  ana_id UUID := '00000000-0000-0000-0000-000000000001';
  luis_id UUID := '00000000-0000-0000-0000-000000000002';
  maria_id UUID := '00000000-0000-0000-0000-000000000003';
  pedro_id UUID := '00000000-0000-0000-0000-000000000004';
  carlos_id UUID := '00000000-0000-0000-0000-000000000005';
  sofia_id UUID := '00000000-0000-0000-0000-000000000006';
  ana_c_id UUID := '00000000-0000-0000-0000-000000000007';
  luis_d_id UUID := '00000000-0000-0000-0000-000000000008';
  carmen_id UUID := '00000000-0000-0000-0000-000000000009';
  diego_id UUID := '00000000-0000-0000-0000-00000000000a';
  valeria_id UUID := '00000000-0000-0000-0000-00000000000b';
  jose_id UUID := '00000000-0000-0000-0000-00000000000c';
BEGIN
  -- ==============================
  -- 1. CREATE AUTH USERS
  -- ==============================

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (ana_id, 'ana.admin@lobueno.co', _pwd, now(), '{"full_name":"Ana Admin"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (luis_id, 'luis.sys@lobueno.co', _pwd, now(), '{"full_name":"Luis SYS"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (maria_id, 'maria.directora@agenciacentral.com', _pwd, now(), '{"full_name":"Maria Directora"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (pedro_id, 'pedro.director@agenciadigital.mx', _pwd, now(), '{"full_name":"Pedro Director"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (carlos_id, 'carlos.director@creativastudio.com', _pwd, now(), '{"full_name":"Carlos Director"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (sofia_id, 'sofia.colab@lobueno.co', _pwd, now(), '{"full_name":"Sofia Colaboradora"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (ana_c_id, 'ana.creativa@creativastudio.com', _pwd, now(), '{"full_name":"Ana Creativa"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (luis_d_id, 'luis.diseno@agenciacentral.com', _pwd, now(), '{"full_name":"Luis Diseño"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (carmen_id, 'carmen.redaccion@agenciacentral.com', _pwd, now(), '{"full_name":"Carmen Redacción"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (diego_id, 'diego.data@agenciadigital.mx', _pwd, now(), '{"full_name":"Diego Data"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (valeria_id, 'valeria.social@lobueno.co', _pwd, now(), '{"full_name":"Valeria Social"}')
  ON CONFLICT (id) DO NOTHING;

  -- Skip jose if already exists (may have been created via Dashboard)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jose.rodriguez@lobueno.co') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (jose_id, 'jose.rodriguez@lobueno.co', _pwd, now(), '{"full_name":"José Rodríguez"}');
  END IF;

  -- ==============================
  -- 2. UPDATE PROFILES (trigger auto-creates them)
  -- ==============================

  UPDATE profiles SET role = 'SUPERADMIN', full_name = 'Ana Admin', position = 'Directora General', capacity = 100 WHERE id = ana_id;
  UPDATE profiles SET role = 'SYSADMIN',   full_name = 'Luis SYS',     position = 'SysAdmin Técnico',   capacity = 100 WHERE id = luis_id;
  UPDATE profiles SET role = 'DIRECTOR',   full_name = 'Maria Directora', position = 'Directora de Cuenta', capacity = 80 WHERE id = maria_id;
  UPDATE profiles SET role = 'DIRECTOR',   full_name = 'Pedro Director',  position = 'Director Digital',    capacity = 80 WHERE id = pedro_id;
  UPDATE profiles SET role = 'DIRECTOR',   full_name = 'Carlos Director', position = 'Director Creativo',   capacity = 80 WHERE id = carlos_id;
  UPDATE profiles SET role = 'COLABORADOR', full_name = 'Sofia Colaboradora', position = 'Trafficker',     capacity = 60 WHERE id = sofia_id;
  UPDATE profiles SET role = 'COLABORADOR', full_name = 'Ana Creativa',   position = 'Diseñadora Gráfica',  capacity = 60 WHERE id = ana_c_id;
  UPDATE profiles SET role = 'COLABORADOR', full_name = 'Luis Diseño',    position = 'Diseñador UI/UX',     capacity = 60 WHERE id = luis_d_id;
  UPDATE profiles SET role = 'COLABORADOR', full_name = 'Carmen Redacción', position = 'Redactora Creativa', capacity = 60 WHERE id = carmen_id;
  UPDATE profiles SET role = 'COLABORADOR', full_name = 'Diego Data',     position = 'Analista de Datos',   capacity = 60 WHERE id = diego_id;
  UPDATE profiles SET role = 'COLABORADOR', full_name = 'Valeria Social', position = 'Community Manager',   capacity = 60 WHERE id = valeria_id;
  UPDATE profiles SET role = 'SUPERADMIN',  full_name = 'José Rodríguez', position = 'Director de Operaciones', capacity = 100 WHERE id = jose_id;

  -- ==============================
  -- 3. ASSIGN USERS TO ACCOUNTS (for RBAC traffic view)
  -- ==============================

  -- Ana (SUPERADMIN) sees all — no filtering needed
  -- Luis (SYSADMIN) sees all — no filtering needed

  -- Maria (DIRECTOR) → Agencia Central accounts
  INSERT INTO profile_accounts (profile_id, account_id) VALUES
    (maria_id, 'c0000000-0000-0000-0000-000000000010'), -- Coca-Cola
    (maria_id, 'c0000000-0000-0000-0000-000000000011'), -- Under Armour México
    (maria_id, 'c0000000-0000-0000-0000-000000000012')  -- Samsung
  ON CONFLICT DO NOTHING;

  -- Pedro (DIRECTOR) → Agencia Digital accounts
  INSERT INTO profile_accounts (profile_id, account_id) VALUES
    (pedro_id, 'c0000000-0000-0000-0000-000000000013'), -- Mercado Libre
    (pedro_id, 'c0000000-0000-0000-0000-000000000014'), -- Uber Eats
    (pedro_id, 'c0000000-0000-0000-0000-000000000015')  -- Spotify
  ON CONFLICT DO NOTHING;

  -- Carlos (DIRECTOR) → Creativa Studio accounts
  INSERT INTO profile_accounts (profile_id, account_id) VALUES
    (carlos_id, 'c0000000-0000-0000-0000-000000000016'), -- Netflix
    (carlos_id, 'c0000000-0000-0000-0000-000000000017'), -- Apple Music
    (carlos_id, 'c0000000-0000-0000-0000-000000000018')  -- Disney+
  ON CONFLICT DO NOTHING;

  -- ==============================
  -- 4. ASSIGN TASKS TO USERS
  -- ==============================

  UPDATE tasks SET assignee_id = sofia_id,  created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000200'; -- Brief
  UPDATE tasks SET assignee_id = ana_c_id,  created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000201'; -- Redes
  UPDATE tasks SET assignee_id = luis_d_id, created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000202'; -- Spot TV
  UPDATE tasks SET assignee_id = diego_id,  created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000203'; -- Medios
  UPDATE tasks SET assignee_id = sofia_id,  created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000204'; -- KPIs
  UPDATE tasks SET assignee_id = luis_d_id, created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000205'; -- UI/UX
  UPDATE tasks SET assignee_id = luis_d_id, created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000206'; -- iOS
  UPDATE tasks SET assignee_id = valeria_id,created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000207'; -- Influencers
  UPDATE tasks SET assignee_id = sofia_id,  created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000208'; -- Evento
  UPDATE tasks SET assignee_id = carmen_id, created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000209'; -- Contenidos
  UPDATE tasks SET assignee_id = luis_d_id, created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000210'; -- Landing
  UPDATE tasks SET assignee_id = valeria_id,created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000211'; -- Email
  UPDATE tasks SET assignee_id = sofia_id,  created_by = maria_id WHERE id = 'f0000000-0000-0000-0000-000000000212'; -- Reviewers
  UPDATE tasks SET assignee_id = ana_c_id,  created_by = pedro_id WHERE id = 'f0000000-0000-0000-0000-000000000213'; -- HotSale creatividades
  UPDATE tasks SET assignee_id = diego_id,  created_by = pedro_id WHERE id = 'f0000000-0000-0000-0000-000000000214'; -- Meta Ads
  UPDATE tasks SET assignee_id = diego_id,  created_by = pedro_id WHERE id = 'f0000000-0000-0000-0000-000000000215'; -- Post HotSale
  UPDATE tasks SET assignee_id = ana_c_id,  created_by = carlos_id WHERE id = 'f0000000-0000-0000-0000-000000000216'; -- Key art
  UPDATE tasks SET assignee_id = valeria_id,created_by = carlos_id WHERE id = 'f0000000-0000-0000-0000-000000000217'; -- Social
  UPDATE tasks SET assignee_id = diego_id,  created_by = carlos_id WHERE id = 'f0000000-0000-0000-0000-000000000218'; -- Programática
  UPDATE tasks SET assignee_id = ana_c_id,  created_by = pedro_id WHERE id = 'f0000000-0000-0000-0000-000000000219'; -- Branding festival
  UPDATE tasks SET assignee_id = diego_id,  created_by = pedro_id WHERE id = 'f0000000-0000-0000-0000-000000000220'; -- Ads festival
  UPDATE tasks SET assignee_id = sofia_id,  created_by = pedro_id WHERE id = 'f0000000-0000-0000-0000-000000000221'; -- Talento (BLOCKED)
  UPDATE tasks SET assignee_id = ana_c_id,  created_by = carlos_id WHERE id = 'f0000000-0000-0000-0000-000000000222'; -- Shoot
  UPDATE tasks SET assignee_id = diego_id,  created_by = carlos_id WHERE id = 'f0000000-0000-0000-0000-000000000223'; -- Lanzamiento

  -- ==============================
  -- 5. INSERT COMMENTS WITH REAL AUTHOR IDs
  -- ==============================

  INSERT INTO comments (id, task_id, author_id, content) VALUES
    ('f0000000-0000-0000-0000-000000000300', 'f0000000-0000-0000-0000-000000000201', ana_c_id, 'Revisar tono de marca con el cliente antes de finalizar'),
    ('f0000000-0000-0000-0000-000000000301', 'f0000000-0000-0000-0000-000000000202', maria_id, 'Esperando confirmación de locación para grabación'),
    ('f0000000-0000-0000-0000-000000000302', 'f0000000-0000-0000-0000-000000000206', luis_d_id, 'Build de prueba lista para QA'),
    ('f0000000-0000-0000-0000-000000000303', 'f0000000-0000-0000-0000-000000000210', luis_d_id, 'Revisar versión mobile responsive'),
    ('f0000000-0000-0000-0000-000000000304', 'f0000000-0000-0000-0000-000000000221', sofia_id, 'Bloqueado por presupuesto no aprobado — escalar con dirección'),
    ('f0000000-0000-0000-0000-000000000305', 'f0000000-0000-0000-0000-000000000214', diego_id, 'Meta Business Suite configurado, pendiente revisión'),
    ('f0000000-0000-0000-0000-000000000306', 'f0000000-0000-0000-0000-000000000216', carlos_id, 'Aprobación de key art pendiente de Netflix')
  ON CONFLICT (id) DO NOTHING;

END $$;
