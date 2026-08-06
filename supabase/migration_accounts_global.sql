-- =============================================
-- AgencyGrid — Fase C: cuentas globales (many-to-many con agencias)
-- ---------------------------------------------
-- Las cuentas ya NO estan atadas a una agencia en su
-- creacion. Se asignan a agencias segun necesidad via
-- la tabla account_agencies (join).
-- =============================================

BEGIN;

-- 1) Tabla join account_agencies
CREATE TABLE IF NOT EXISTS account_agencies (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  PRIMARY KEY (account_id, agency_id)
);
ALTER TABLE account_agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_agencies_select" ON account_agencies;
DROP POLICY IF EXISTS "account_agencies_insert" ON account_agencies;
DROP POLICY IF EXISTS "account_agencies_update" ON account_agencies;
DROP POLICY IF EXISTS "account_agencies_delete" ON account_agencies;

CREATE POLICY "account_agencies_select" ON account_agencies FOR SELECT USING (true);
CREATE POLICY "account_agencies_insert" ON account_agencies FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "account_agencies_update" ON account_agencies FOR UPDATE USING (is_sysadmin());
CREATE POLICY "account_agencies_delete" ON account_agencies FOR DELETE USING (is_superadmin());

-- 2) Backfill: cuentas existentes con agencia asignada
INSERT INTO account_agencies (account_id, agency_id)
SELECT id, agency_id FROM accounts WHERE agency_id IS NOT NULL
ON CONFLICT (account_id, agency_id) DO NOTHING;

-- 3) Quitar política dependiente en agencies antes de borrar la columna
DROP POLICY IF EXISTS "catalogos_select" ON agencies;

-- 4) Quitar agencia obligatoria de accounts
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_agency_id_fkey;
DROP INDEX IF EXISTS idx_accounts_agency;
ALTER TABLE accounts DROP COLUMN IF EXISTS agency_id;

COMMIT;