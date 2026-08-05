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
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_teams ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PART 2: Purga de usuarios seed (credenciales Test1234!)
-- -------------------------------------------------------------
-- Elimina SOLO usuarios de prueba creados por seed_test_users.sql.
-- Conserva cuentas operativas reales/manuales (jose.rodriguez).
-- =============================================

-- Lista de emails de prueba (seed_test_users.sql)
DELETE FROM auth.users
WHERE email IN (
  'ana.admin@lobueno.co',
  'luis.sys@lobueno.co',
  'maria.directora@agenciacentral.com',
  'pedro.director@agenciadigital.mx',
  'carlos.director@creativastudio.com',
  'sofia.colab@lobueno.co',
  'ana.creativa@creativastudio.com',
  'luis.diseno@agenciacentral.com',
  'carmen.redaccion@agenciacentral.com',
  'diego.data@agenciadigital.mx',
  'valeria.social@lobueno.co'
);

-- NOTA: se conserva a propósito 'jose.rodriguez@lobueno.co' (cuenta
-- de operación/SUPERADMIN real). Si quieres purgarla también, quita la
-- siguiente línea del comentario y borra el email de la lista anterior.

-- Limpieza de relaciones huérfanas que queden tras el borrado (por si acaso).
DELETE FROM public.profile_accounts pa
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pa.profile_id);
DELETE FROM public.profile_teams pt
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pt.profile_id);
DELETE FROM public.directors
  WHERE profile_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = directors.profile_id);

COMMIT;