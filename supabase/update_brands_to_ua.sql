-- =============================================
-- UPDATE: Reemplazar Nike, Adidas, Vans → Under Armour
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Accounts
UPDATE accounts SET name = 'Under Armour México', code = 'UA-MX'
WHERE id = 'c0000000-0000-0000-0000-000000000011';

UPDATE accounts SET name = 'Under Armour LatAm', code = 'UA-LAT'
WHERE id = 'c0000000-0000-0000-0000-000000000021';

UPDATE accounts SET name = 'Under Armour Performance', code = 'UA-PRF'
WHERE id = 'c0000000-0000-0000-0000-000000000022';

-- 2. Teams
UPDATE teams SET name = 'UA Digital', code = 'UA-DG'
WHERE id = 'e0000000-0000-0000-0000-000000000012';

UPDATE teams SET name = 'UA Lifestyle', code = 'UA-LS'
WHERE id = 'e0000000-0000-0000-0000-000000000020';

UPDATE teams SET name = 'UA Performance', code = 'UA-PR'
WHERE id = 'e0000000-0000-0000-0000-000000000021';

-- 3. Projects
UPDATE projects SET name = 'UA Community App', description = 'Lanzamiento de app para comunidad fitness'
WHERE id = 'f0000000-0000-0000-0000-000000000102';

UPDATE projects SET name = 'UA HOVR Launch', description = 'Campaña de lanzamiento HOVR 2025'
WHERE id = 'f0000000-0000-0000-0000-000000000103';

UPDATE projects SET name = 'UA HOVR Collection Drop', description = 'Lanzamiento colección verano'
WHERE id = 'f0000000-0000-0000-0000-000000000112';

-- 4. Tasks
UPDATE tasks SET description = 'Diseñar interfaz de app fitness'
WHERE id = 'f0000000-0000-0000-0000-000000000205';

UPDATE tasks SET description = 'Contactar 10 fitness influencers'
WHERE id = 'f0000000-0000-0000-0000-000000000207';

-- 5. Verify
SELECT 'ACCOUNTS' as type, id, name, code FROM accounts WHERE id IN (
  'c0000000-0000-0000-0000-000000000011',
  'c0000000-0000-0000-0000-000000000021',
  'c0000000-0000-0000-0000-000000000022'
)
UNION ALL
SELECT 'TEAMS' as type, id, name, code FROM teams WHERE id IN (
  'e0000000-0000-0000-0000-000000000012',
  'e0000000-0000-0000-0000-000000000020',
  'e0000000-0000-0000-0000-000000000021'
)
UNION ALL
SELECT 'PROJECTS' as type, id, name, '' as code FROM projects WHERE id IN (
  'f0000000-0000-0000-0000-000000000102',
  'f0000000-0000-0000-0000-000000000103',
  'f0000000-0000-0000-0000-000000000112'
);
