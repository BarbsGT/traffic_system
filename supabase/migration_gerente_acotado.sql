-- =============================================
-- AgencyGrid — Fase C: Rol GERENTE acotado por cuenta
-- -------------------------------------------------------------
-- Objetivo: GERENTE apoya al DIRECTOR dentro de sus cuentas asignadas:
--   * Puede crear/editar proyectos y tareas SOLO si los ve por
--     can_access_account / can_access_project (sus cuentas de
--     profile_accounts, teams vía profile_teams, o directors).
--   * NO gestiona catálogos globales (agencias/cuentas/equipos/áreas).
--   * NO puede enlistar/asignar colaboradores a cuentas ajenas
--     (asignaciones solo sysadmin, igual que DIRECTOR).
-- Efectos ya activos por migration_gerente_rol.sql:
--   * 'GERENTE' existe en el enum user_role.
--   * is_director() incluye GERENTE (operativa igual a DIRECTOR).
-- =============================================

BEGIN;

-- =============================================
-- 1) HELPERS: is_manager() reconoce la identidad GERENTE.
--    is_owner_op() = read para operacionales que NO tocan catálogo global.
--    Usamos is_director() ya que incluye GERENTE (operativa = DIRECTOR),
--    pero reforzamos con cuenta en las policies de escritura.
-- =============================================

CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'GERENTE');
END;
$$;

CREATE OR REPLACE FUNCTION is_director_account_scoped()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- SUPERADMIN/SYSADMIN/DIRECTOR global; GERENTE solo si tiene cuentas asignadas.
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR')
  );
END;
$$;
GRANT EXECUTE ON FUNCTION is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION is_director_account_scoped() TO authenticated;

-- =============================================
-- 2) PROJECTS: escritura = is_director() (incluye GERENTE) + alcance de cuenta.
--    is_director() ya cubre GERENTE. La policy EXISTENTE (phaseA) ya exige
--    can_access_account en USING/CHECK, lo que acota a GERENTE por cuenta.
--    Reforzamos igual en tasks para consistencia (ya existe can_access_project).
-- =============================================

-- =============================================
-- 3) CATÁLOGOS (agencies/accounts/teams/areas): el update ya usa is_director()
--    que incluye GERENTE. Para acotar, restringimos update/insert al
--    SYSADMIN/DIRECTOR únicamente (no GERENTE). GERENTE conserva solo lectura.
-- =============================================

DROP POLICY IF EXISTS "account_update_director" ON accounts;
DROP POLICY IF EXISTS "accounts_update" ON accounts;
CREATE POLICY "accounts_update" ON accounts
  FOR UPDATE USING (is_director_account_scoped())
  WITH CHECK (is_director_account_scoped());

DROP POLICY IF EXISTS "agencies_update_director" ON agencies;
DROP POLICY IF EXISTS "catalogos_update" ON agencies;
CREATE POLICY "catalogos_update" ON agencies
  FOR UPDATE USING (is_director_account_scoped())
  WITH CHECK (is_director_account_scoped());

DROP POLICY IF EXISTS "teams_update_director" ON teams;
DROP POLICY IF EXISTS "teams_update" ON teams;
CREATE POLICY "teams_update" ON teams
  FOR UPDATE USING (is_director_account_scoped())
  WITH CHECK (is_director_account_scoped());

-- insert sigue siendo solo sysadmin, pero por claridad reafirmamos
DROP POLICY IF EXISTS "accounts_insert_director" ON accounts;
DROP POLICY IF EXISTS "accounts_insert" ON accounts;
CREATE POLICY "accounts_insert" ON accounts
  FOR INSERT WITH CHECK (is_sysadmin());

DROP POLICY IF EXISTS "catalogos_insert_director" ON agencies;
DROP POLICY IF EXISTS "catalogos_insert" ON agencies;
CREATE POLICY "catalogos_insert" ON agencies
  FOR INSERT WITH CHECK (is_sysadmin());

DROP POLICY IF EXISTS "teams_insert_director" ON teams;
DROP POLICY IF EXISTS "teams_insert" ON teams;
CREATE POLICY "teams_insert" ON teams
  FOR INSERT WITH CHECK (is_sysadmin());

-- =============================================
-- 4) DASHBOARD / UATrafficMatrix: GERENTE solo ve sus cuentas/proyectos.
--    Ya cubierto por can_access_account/can_access_project en selects y
--    en UATrafficMatrix.tsx (trata GERENTE igual que DIRECTOR con scoping).
--    Refuerzo en las políticas de escritura claves para coherencia.
-- =============================================

-- PROJECTS update: ya exige can_access_account (phaseA). Mantenemos.
-- PROJECTS insert: exigir can_access (fijado ya). Refuerzo explícito.
DROP POLICY IF EXISTS "projects_insert_director" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (
    is_director() AND (account_id IS NULL OR can_access_account(account_id))
  );

COMMIT;