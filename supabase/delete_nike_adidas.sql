-- Eliminar Nike, Adidas, Vans de la base de datos
-- Ejecutar en Supabase SQL Editor

-- Eliminar proyectos de tráfico de Nike/Adidas/Vans (cascade elimina tasks asociadas)
DELETE FROM projects
WHERE type = 'ua_traffic' AND account_id IN (
  SELECT id FROM accounts
  WHERE LOWER(name) LIKE ANY(ARRAY['%nike%', '%adidas%', '%vans%'])
);

-- Eliminar cuentas Nike, Adidas, Vans
DELETE FROM accounts
WHERE LOWER(name) LIKE ANY(ARRAY['%nike%', '%adidas%', '%vans%']);

-- Verificar
SELECT id, name FROM accounts WHERE LOWER(name) LIKE ANY(ARRAY['%nike%', '%adidas%', '%vans%']);
