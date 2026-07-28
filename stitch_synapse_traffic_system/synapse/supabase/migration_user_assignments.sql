-- User assignments: junction tables

CREATE TABLE profile_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, account_id)
);

ALTER TABLE profile_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE profile_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, team_id)
);

ALTER TABLE profile_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_accounts_select" ON profile_accounts FOR SELECT USING (true);
CREATE POLICY "profile_accounts_insert" ON profile_accounts FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "profile_accounts_delete" ON profile_accounts FOR DELETE USING (is_sysadmin());

CREATE POLICY "profile_teams_select" ON profile_teams FOR SELECT USING (true);
CREATE POLICY "profile_teams_insert" ON profile_teams FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "profile_teams_delete" ON profile_teams FOR DELETE USING (is_sysadmin());

CREATE INDEX idx_profile_accounts_profile ON profile_accounts(profile_id);
CREATE INDEX idx_profile_accounts_account ON profile_accounts(account_id);
CREATE INDEX idx_profile_teams_profile ON profile_teams(profile_id);
CREATE INDEX idx_profile_teams_team ON profile_teams(team_id);
