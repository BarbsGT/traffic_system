-- Set jose.rodriguez@lobueno.co as SUPERADMIN
-- Run in Supabase SQL Editor

UPDATE public.profiles
SET
  role = 'SUPERADMIN',
  full_name = 'José Rodríguez',
  position = 'Director de Operaciones',
  capacity = 100
WHERE id = (
  SELECT u.id
  FROM auth.users u
  WHERE u.email = 'jose.rodriguez@lobueno.co'
);

-- Verify
SELECT p.id, p.role, p.full_name, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'jose.rodriguez@lobueno.co';