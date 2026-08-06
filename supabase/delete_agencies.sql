-- Delete specific agencies: Agencia Central and Agencia Creativa
-- Run in Supabase SQL Editor (uses team_accounts, not teams.account_id)

BEGIN;

-- Get the agency IDs
DO $$
DECLARE
  agencia_central_id UUID;
  agencia_creativa_id UUID;
BEGIN
  SELECT id INTO agencia_central_id FROM agencies WHERE name = 'Agencia Central';
  SELECT id INTO agencia_creativa_id FROM agencies WHERE name = 'Agencia Creativa';

  IF agencia_central_id IS NOT NULL THEN
    -- Delete related data for Agencia Central
    -- profile_accounts -> accounts of this agency
    DELETE FROM profile_accounts WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_central_id);
    -- profile_teams -> teams assigned to accounts of this agency (via team_accounts)
    DELETE FROM profile_teams WHERE team_id IN (SELECT team_id FROM team_accounts WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_central_id));
    -- tasks -> projects of accounts of this agency
    DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_central_id));
    -- projects -> accounts of this agency
    DELETE FROM projects WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_central_id);
    -- team_accounts -> accounts of this agency
    DELETE FROM team_accounts WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_central_id);
    -- directors -> accounts of this agency
    DELETE FROM directors WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_central_id);
    -- accounts -> agency
    DELETE FROM accounts WHERE agency_id = agencia_central_id;
    -- agency
    DELETE FROM agencies WHERE id = agencia_central_id;
    RAISE NOTICE 'Agencia Central eliminada';
  END IF;

  IF agencia_creativa_id IS NOT NULL THEN
    -- Delete related data for Agencia Creativa
    DELETE FROM profile_accounts WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_creativa_id);
    DELETE FROM profile_teams WHERE team_id IN (SELECT team_id FROM team_accounts WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_creativa_id));
    DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_creativa_id));
    DELETE FROM projects WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_creativa_id);
    DELETE FROM team_accounts WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_creativa_id);
    DELETE FROM directors WHERE account_id IN (SELECT id FROM accounts WHERE agency_id = agencia_creativa_id);
    DELETE FROM accounts WHERE agency_id = agencia_creativa_id;
    DELETE FROM agencies WHERE id = agencia_creativa_id;
    RAISE NOTICE 'Agencia Creativa eliminada';
  END IF;
END $$;

COMMIT;