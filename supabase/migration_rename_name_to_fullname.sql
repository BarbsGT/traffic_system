-- Rename name to full_name for profiles

-- Check if 'name' column exists and 'full_name' doesn't
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
      ALTER TABLE profiles RENAME COLUMN name TO full_name;
    END IF;
  END IF;
END $$;

-- Ensure full_name exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
  END IF;
END $$;
