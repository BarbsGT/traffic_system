-- =============================================
-- FIX: Ensure jose.rodriguez@lobueno.co has profile + SUPERADMIN role
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Find the auth user ID
DO $$
DECLARE
  _user_id UUID;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'jose.rodriguez@lobueno.co';

  IF _user_id IS NULL THEN
    RAISE NOTICE 'ERROR: User jose.rodriguez@lobueno.co not found in auth.users';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user ID: %', _user_id;

  -- 2. Create profile if missing
  INSERT INTO profiles (id, full_name, email, role, position, capacity, is_active)
  VALUES (_user_id, 'José Rodríguez', 'jose.rodriguez@lobueno.co', 'SUPERADMIN', 'Director de Operaciones', 100, true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'SUPERADMIN',
    full_name = 'José Rodríguez',
    position = 'Director de Operaciones',
    capacity = 100,
    is_active = true;

  RAISE NOTICE 'Profile created/updated with SUPERADMIN role';

  -- 3. Reset password to Test1234!
  UPDATE auth.users
  SET encrypted_password = crypt('Test1234!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = _user_id;

  RAISE NOTICE 'Password reset to Test1234!';
END $$;

-- 4. Verify
SELECT
  u.id,
  u.email,
  p.role,
  p.full_name,
  p.position,
  p.capacity,
  CASE WHEN u.encrypted_password IS NOT NULL THEN 'HAS PASSWORD' ELSE 'NO PASSWORD' END AS pwd_status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'jose.rodriguez@lobueno.co';
