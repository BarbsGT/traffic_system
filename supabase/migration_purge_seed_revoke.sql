-- =============================================
-- AgencyGrid — Fase C: Least-privilege grants + purge de usuarios seed
-- Run AFTER migration_all.sql in Supabase SQL Editor.
-- NO hace DDL destructivo: solo ajusta GRANTs y limpia usuarios de prueba.
-- =============================================

BEGIN;

-- =============================================
-- PART 1: Reemplazar el GRANT ALL<> por grants mínimos
-- (RLS se encarga del multi-tenant; no necesitamos ALL.)
-- =============================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- Privilegios DML mínimos que necesitan los clientes autenticados.
-- Las policies de RLS restringen el acceso fila por fila (multi-tenant).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Asegurar RLS activa en tablas de negocio (red de seguridad).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_columns ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PART 2: Purga de usuarios seed (credenciales Test1234!)
-- -------------------------------------------------------------
-- Elimina SOLO usuarios de prueba creados por seed_test_users.sql.
-- Conserva cuentas operativas reales/manuales (jose.rodriguez).
-- =============================================

-- Lista de emails de prueba (seed_test_users.sql)
CREATE TEMP TABLE IF NOT EXISTS _purge AS VALUES
  ('ana.admin@lobueno.co'),
  ('luis.sys@lobueno.co'),
  ('maria.directora@agenciacentral.com'),
  ('pedro.director@agenciadigital.mx'),
  ('carlos.director@creativastudio.com'),
  ('sofia.colab@lobueno.co'),
  ('ana.creativa@creativastudio.com'),
  ('luis.diseno@agenciacentral.com'),
  ('carmen.redaccion@agenciacentral.com'),
  ('diego.data@agenciadigital.mx'),
  ('valeria.social@lobueno.co');

-- Desenlazar referencias de perfiles a eliminar (para no bloquear el DELETE por FK)
UPDATE public.profiles
   SET manager_id = NULL
 WHERE manager_id IN (SELECT id FROM profiles WHERE email IN (SELECT column1 FROM _purge));

UPDATE public.projects
   SET owner_id = NULL
 WHERE owner_id IN (SELECT id FROM profiles WHERE email IN (SELECT column1 FROM _purge));

UPDATE public.tasks
   SET assignee_id = NULL
 WHERE assignee_id IN (SELECT id FROM profiles WHERE email IN (SELECT column1 FROM _purge));

UPDATE public.tasks
   SET created_by = NULL
 WHERE created_by IN (SELECT id FROM profiles WHERE email IN (SELECT column1 FROM _purge));

UPDATE public.teams
   SET director_id = NULL
 WHERE director_id IN (SELECT id FROM profiles WHERE email IN (SELECT column1 FROM _purge));

-- comments.project_messages guardan author_id NOT NULL: se eliminan por completo.
DELETE FROM public.comments
  WHERE author_id IN (SELECT id FROM public.profiles WHERE email IN (SELECT column1 FROM _purge));
DELETE FROM public.project_messages
  WHERE author_id IN (SELECT id FROM public.profiles WHERE email IN (SELECT column1 FROM _purge));
DELETE FROM public.chat_messages
  WHERE profile_id IN (SELECT id FROM public.profiles WHERE email IN (SELECT column1 FROM _purge));

UPDATE public.task_history
   SET changed_by = NULL
 WHERE changed_by IN (SELECT id FROM profiles WHERE email IN (SELECT column1 FROM _purge));

-- Eliminar relaciones de perfiles a purgar
DELETE FROM public.profile_accounts
  WHERE profile_id IN (SELECT id FROM public.profiles WHERE email IN (SELECT column1 FROM _purge));
DELETE FROM public.profile_teams
  WHERE profile_id IN (SELECT id FROM public.profiles WHERE email IN (SELECT column1 FROM _purge));
DELETE FROM public.directors
  WHERE profile_id IN (SELECT id FROM public.profiles WHERE email IN (SELECT column1 FROM _purge));

-- Eliminar los perfiles (por si quedan sin auth user) y sus auth.users
DELETE FROM public.profiles
  WHERE email IN (SELECT column1 FROM _purge);
DELETE FROM auth.users
  WHERE email IN (SELECT column1 FROM _purge);

DROP TABLE _purge;

-- Limpieza de relaciones huérfanas que queden tras el borrado (por si acaso).
DELETE FROM public.profile_accounts pa
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pa.profile_id);
DELETE FROM public.profile_teams pt
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pt.profile_id);
DELETE FROM public.directors
  WHERE profile_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = directors.profile_id);

COMMIT;