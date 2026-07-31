-- Add account_id to directors table (replacing team_id semantics)
ALTER TABLE directors ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
