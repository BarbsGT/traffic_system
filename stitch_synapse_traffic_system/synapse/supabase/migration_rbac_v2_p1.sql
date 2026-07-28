-- RBAC v2 Part 1: Role enum additions
-- This migration ensures all role values exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR', 'COLABORADOR');
  END IF;
END $$;

ALTER TABLE profiles ALTER COLUMN role TYPE text;
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR', 'COLABORADOR');
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'COLABORADOR';
