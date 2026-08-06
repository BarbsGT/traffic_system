-- =============================================
-- FIX (aplicar en Supabase SQL Editor — UNA SOLA VEZ)
-- Visibilidad de la tabla `agencies` en el Catálogo
-- -------------------------------------------------------------
-- Problema: migration_accounts_global.sql eliminó `accounts.agency_id`
-- (las agencias ahora se vinculan vía `account_agencies`). Pero la
-- política "catalogos_select" de migration_security_hardening.sql
-- seguía referenciando `accounts.agency_id`, por lo que el SELECT de
-- agencias fallaba: filas existentes en `agencies` no se veían en la app
-- y al crear una con el mismo nombre se disparaba el constraint UNIQUE.
-- -------------------------------------------------------------
-- Solución: recrear la política apuntando a `account_agencies`.
--   * SUPERADMIN/SYSADMIN -> ven TODAS las agencias (is_sysadmin()).
--   * DIRECTOR / GERENTE / COLABORADOR -> ven agencias con al menos una
--     cuenta accesible.
-- =============================================

DROP POLICY IF EXISTS "catalogos_select" ON agencies;

CREATE POLICY "catalogos_select" ON agencies
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      is_sysadmin()
      OR EXISTS (
        SELECT 1
        FROM account_agencies aa
        JOIN accounts ac ON ac.id = aa.account_id
        WHERE aa.agency_id = agencies.id AND can_access_account(aa.account_id)
      )
    )
  );

COMMIT;

-- Verificación (debe devolver TODAS las agencias para un admin):
-- SELECT id, name, is_active FROM agencies ORDER BY name;