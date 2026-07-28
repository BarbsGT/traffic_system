-- Collaborator hierarchy: position, position_description, manager_id

-- These columns are already part of profiles table:
-- position TEXT DEFAULT ''
-- position_description TEXT DEFAULT ''
-- manager_id UUID REFERENCES profiles(id)

-- Add any missing columns if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position') THEN
    ALTER TABLE profiles ADD COLUMN position TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position_description') THEN
    ALTER TABLE profiles ADD COLUMN position_description TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'manager_id') THEN
    ALTER TABLE profiles ADD COLUMN manager_id UUID REFERENCES profiles(id);
  END IF;
END $$;
