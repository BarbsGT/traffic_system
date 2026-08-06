-- =============================================
-- FIX: can_access_account debe incluir al colaborador asignado a una tarea
-- -------------------------------------------------------------
-- Problema: en /projects/account-dashboard la lista de cuentas se filtra por
-- can_access_account. Laury (COLABORADOR) tiene una tarea asignada en un
-- proyecto del account Under Armour, pero no ve la cuenta ("Sin cuentas
-- disponibles") porque la asignación de tarea no otorgaba acceso a la cuenta.
--
-- Solución: extender can_access_account para que devuelva TRUE cuando el
-- usuario tiene al menos una tarea asignada (tasks.assignee_id) en un
-- proyecto perteneciente a esa cuenta. La visibilidad de los proyectos de la
-- cuenta sigue acotada por can_access_project (RLS), así que el colaborador
-- solo ve sus proyectos/tareas, no toda la cuenta.
--
-- Aplicar en Supabase → SQL Editor (UNA SOLA VEZ, tras migration_rbac_v3 y
-- migration_security_hardening).
-- =============================================

CREATE OR REPLACE FUNCTION can_access_account(aid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF is_sysadmin() THEN RETURN TRUE; END IF;
  IF aid IS NULL THEN RETURN FALSE; END IF;

  RETURN EXISTS (
    -- Usuario asignado directamente a la cuenta
    SELECT 1 FROM profile_accounts WHERE account_id = aid AND profile_id = auth.uid()
  ) OR EXISTS (
    -- Usuario es manager (director) de la cuenta
    SELECT 1 FROM profile_accounts WHERE account_id = aid AND manager_id = auth.uid()
  ) OR EXISTS (
    -- Es director de la cuenta
    SELECT 1 FROM directors WHERE account_id = aid AND profile_id = auth.uid() AND is_active = true
  ) OR EXISTS (
    -- Es miembro de un equipo vinculado a la cuenta
    SELECT 1 FROM profile_teams pt JOIN teams t ON t.id = pt.team_id
    WHERE pt.profile_id = auth.uid() AND t.account_id = aid
  ) OR EXISTS (
    -- Tiene una tarea asignada en un proyecto de la cuenta
    SELECT 1 FROM tasks tk JOIN projects p ON p.id = tk.project_id
    WHERE p.account_id = aid AND tk.assignee_id = auth.uid()
  );
END;
$$;

COMMIT;

-- Verificación: conectado como Laury debe devolver la cuenta Under Armour.
-- SELECT id, name FROM accounts ORDER BY name;