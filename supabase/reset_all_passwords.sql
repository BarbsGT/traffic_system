-- =============================================
-- AgencyGrid — Reset all test user passwords
-- Password: Test1234!
-- Run in Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reset password for ALL existing auth users
UPDATE auth.users
SET encrypted_password = crypt('Test1234!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email IN (
  'ana.admin@lobueno.co',
  'luis.sys@lobueno.co',
  'maria.directora@agenciacentral.com',
  'pedro.director@agenciadigital.mx',
  'carlos.director@creativastudio.com',
  'sofia.colab@lobueno.co',
  'ana.creativa@creativastudio.com',
  'luis.diseno@agenciacentral.com',
  'carmen.redaccion@agenciacentral.com',
  'diego.data@agenciadigital.mx',
  'valeria.social@lobueno.co',
  'jose.rodriguez@lobueno.co'
);

-- Create jose if not exists
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
SELECT
  '00000000-0000-0000-0000-00000000000c',
  'jose.rodriguez@lobueno.co',
  crypt('Test1234!', gen_salt('bf')),
  now(),
  '{"full_name":"José Rodríguez"}'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'jose.rodriguez@lobueno.co'
);

-- Ensure jose has SUPERADMIN role
UPDATE profiles
SET role = 'SUPERADMIN', full_name = 'José Rodríguez', position = 'Director de Operaciones', capacity = 100
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'jose.rodriguez@lobueno.co'
);

-- Verify all users
SELECT
  u.email,
  p.role,
  p.full_name,
  CASE WHEN u.encrypted_password IS NOT NULL AND u.encrypted_password != '' THEN 'OK' ELSE 'NO PASSWORD' END AS password_status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email IN (
  'ana.admin@lobueno.co',
  'luis.sys@lobueno.co',
  'jose.rodriguez@lobueno.co',
  'maria.directora@agenciacentral.com',
  'pedro.director@agenciadigital.mx',
  'carlos.director@creativastudio.com',
  'sofia.colab@lobueno.co'
)
ORDER BY p.role, u.email;
