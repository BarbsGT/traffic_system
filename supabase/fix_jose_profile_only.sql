-- =============================================
-- FIX: Crear perfil SUPERADMIN para jose.rodriguez@lobueno.co
-- NO toca auth.users — solo profiles
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Crear perfil si no existe
INSERT INTO profiles (id, full_name, email, role, position, capacity, is_active)
SELECT
  id,
  'José Rodríguez',
  'jose.rodriguez@lobueno.co',
  'SUPERADMIN',
  'Director de Operaciones',
  100,
  true
FROM auth.users
WHERE email = 'jose.rodriguez@lobueno.co'
ON CONFLICT (id) DO UPDATE SET
  role = 'SUPERADMIN',
  full_name = 'José Rodríguez',
  position = 'Director de Operaciones',
  capacity = 100,
  is_active = true;

-- Verificar
SELECT u.email, p.role, p.full_name, p.position
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'jose.rodriguez@lobueno.co';
