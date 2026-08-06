-- =============================================
-- FIX (aplicar en Supabase → SQL Editor — UNA SOLA VEZ)
-- can_access_account: JOIN de teams corregido
-- -------------------------------------------------------------
-- Problema: migration_security_hardening.sql / migration_can_access_manager.sql
-- / migration_can_access_task.sql sobrescribieron can_access_account con un
-- JOIN a `teams t ... t.account_id`, pero `teams` NO tiene columna account_id
-- (la relación es vía team_accounts). Resultado: la política "accounts_select"
-- crashea con ERROR 42703 en cada SELECT de accounts para todo usuario no
-- sysadmin → PostgREST responde 400 → la UI muestra "Sin cuentas disponibles".
--
-- Solución: restaurar el JOIN correcto usando team_accounts (versión canónica
-- de migration_teams_global.sql) conservando las ramas añadidas: manager_id,
-- director activo y tarea asignada (tasks.assignee_id).
-- =============================================

CREATE OR REPLACE FUNCTION can_access_account(aid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF is_sysadmin() THEN RETURN TRUE; END IF;
  IF aid IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM profile_accounts WHERE account_id = aid AND profile_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profile_accounts WHERE account_id = aid AND manager_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM directors WHERE account_id = aid AND profile_id = auth.uid() AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM profile_teams pt
    JOIN team_accounts ta ON ta.team_id = pt.team_id
    WHERE pt.profile_id = auth.uid() AND ta.account_id = aid
  ) OR EXISTS (
    SELECT 1 FROM tasks tk JOIN projects p ON p.id = tk.project_id
    WHERE p.account_id = aid AND tk.assignee_id = auth.uid()
  );
END;
$$;

COMMIT;

-- Verificación 1: no debe devolver error
SELECT can_access_account('5bcc5804-bbbe-4723-99a9-d3638a317e3d'::uuid);

-- Verificación 2: simular sesión de Laury y comprobar acceso a Under Armour
-- SELECT set_config('request.jwt.claims',
--   json_build_object('sub','78187da0-69e7-417b-b19d-e76647836b91','role','authenticated')::text, true);
-- SELECT can_access_account('5bcc5804-bbbe-4723-99a9-d3638a317e3d'::uuid);
