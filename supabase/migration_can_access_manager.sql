-- =============================================
-- FIX: can_access_account debe considerar manager_id
-- Un DIRECTOR asignado como manager (manager_id) de un
-- colaborador en una cuenta debe poder acceder a esa cuenta,
-- aunque no esté él mismo en profile_accounts de ella.
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
    SELECT 1 FROM profile_teams pt JOIN teams t ON t.id = pt.team_id
    WHERE pt.profile_id = auth.uid() AND t.account_id = aid
  );
END;
$$;
