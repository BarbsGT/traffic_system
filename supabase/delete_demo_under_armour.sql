-- =============================================================
-- DELETE DEMO — Under Armour (borra SOLO los datos demo)
-- -------------------------------------------------------------
-- Elimina proyectos/tareas nombre demo (prefijo d1e00000-...),
-- sus comentarios, la vinculación profile_accounts y los usuarios
-- demo (auth.users + profiles). NO toca datos reales.
-- =============================================================

-- 1) Comentarios de tareas demo:
DELETE FROM comments WHERE task_id IN (
  SELECT id FROM tasks WHERE tasks.id::text LIKE 'd1e00000-0000-0000-0000-0000000002%'
     OR tasks.id::text LIKE 'd1e00000-0000-0000-0000-0000000003%'
);
DELETE FROM comments WHERE comments.id::text LIKE 'd1e00000-0000-0000-0000-0000000004%';

-- 2) Proyectos demo (tasks + project_messages van en cascada):
DELETE FROM projects WHERE id IN (
  'd1e00000-0000-0000-0000-000000000101',
  'd1e00000-0000-0000-0000-000000000102',
  'd1e00000-0000-0000-0000-000000000103'
);

-- 3) Desvincular usuarios demo de la cuenta:
DELETE FROM profile_accounts
WHERE account_id = '5bcc5804-bbbe-4723-99a9-d3638a317e3d'
  AND profile_id IN (SELECT id FROM profiles WHERE email LIKE '%.demo@lobueno.co');

-- 4) Borrar perfiles y usuarios auth demo:
DELETE FROM profiles WHERE email LIKE '%.demo@lobueno.co';
DELETE FROM auth.users WHERE email LIKE '%.demo@lobueno.co';

-- Verificación (debe devolver 0): 
-- SELECT count(*) FROM projects WHERE projects.id::text LIKE 'd1e00000-0000-0000-0000-0000000001%';
-- SELECT count(*) FROM auth.users WHERE email LIKE '%.demo@lobueno.co';