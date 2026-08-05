-- =============================================
-- AgencyGrid — Fase C: equipos globales (many-to-many)
-- ---------------------------------------------
-- Los equipos ya NO estan atados a una cuenta en su
-- creacion. Se asignan a cuentas segun necesidad via
-- la tabla team_accounts (join).
-- =============================================

BEGIN;

-- 1) Tabla join team_accounts
CREATE TABLE IF NOT EXISTS team_accounts (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, account_id)
);
ALTER TABLE team_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_accounts_select" ON team_accounts;
DROP POLICY IF EXISTS "team_accounts_insert" ON team_accounts;
DROP POLICY IF EXISTS "team_accounts_update" ON team_accounts;
DROP POLICY IF EXISTS "team_accounts_delete" ON team_accounts;

CREATE POLICY "team_accounts_select" ON team_accounts FOR SELECT USING (true);
CREATE POLICY "team_accounts_insert" ON team_accounts FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "team_accounts_update" ON team_accounts FOR UPDATE USING (is_sysadmin());
CREATE POLICY "team_accounts_delete" ON team_accounts FOR DELETE USING (is_superadmin());

-- 2) Backfill: equipos existentes con cuenta asignada
INSERT INTO team_accounts (team_id, account_id)
SELECT id, account_id FROM teams WHERE account_id IS NOT NULL
ON CONFLICT (team_id, account_id) DO NOTHING;

-- 3) Quitar cuenta obligatoria de teams
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_account_id_fkey;
DROP INDEX IF EXISTS idx_teams_account;
ALTER TABLE teams DROP COLUMN IF EXISTS account_id;

-- 4) Reemplazar can_access_account para que use team_accounts
CREATE OR REPLACE FUNCTION can_access_account(aid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF is_sysadmin() THEN RETURN TRUE; END IF;
  IF aid IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM profile_accounts WHERE account_id = aid AND profile_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM directors WHERE account_id = aid AND profile_id = auth.uid() AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM profile_teams pt
    JOIN team_accounts ta ON ta.team_id = pt.team_id
    WHERE pt.profile_id = auth.uid() AND ta.account_id = aid
  );
END;
$$;

COMMIT;