-- Add per-account manager to profile_accounts
-- A user can be assigned to multiple accounts, each with its own manager/director.
ALTER TABLE profile_accounts ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
