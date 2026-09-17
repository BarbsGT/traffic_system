-- Seed Ogilvy Trafico
-- Catálogo real, usuarios ogilvy.com y proyectos Nestlé.
-- Ejecutar DESPUÉS de migration_countries_brands.sql
-- Limpia los datos demo: proyectos, tareas, catálogos y asignaciones viejas.

BEGIN;

-- ==== 1. Limpieza demos ====
DELETE FROM project_messages;
DELETE FROM comments;
DELETE FROM task_history;
DELETE FROM tasks;
DELETE FROM projects;

DELETE FROM account_agencies;
DELETE FROM team_accounts;
DELETE FROM profile_accounts;
DELETE FROM profile_teams;
DELETE FROM directors;
DELETE FROM teams;
DELETE FROM accounts;
DELETE FROM agencies;
DELETE FROM areas;

-- ==== 2. Agencias ====
INSERT INTO agencies (name, code) VALUES ('Ogilvy','OGV'), ('VML','VML');

-- ==== 3. Cuentas (todas de Ogilvy) ====
INSERT INTO accounts (name, code) VALUES ('Nestlé','NES'), ('Cencosud','CEN'), ('CAFAM','CAF'), ('Unilever','UNI');

INSERT INTO account_agencies (account_id, agency_id)
SELECT a.id, (SELECT id FROM agencies WHERE name='Ogilvy')
FROM accounts a WHERE a.name IN ('Nestlé','Cencosud','CAFAM','Unilever');

-- ==== 4. Áreas ====
INSERT INTO areas (name, code) VALUES
  ('Creativos','CREA'), ('Finanzas','FIN'), ('Digital','DIG'), ('Cuentas','CUE'), ('Planeación','PLAN');

-- ==== 5. Marcas (Ogilvy -> Nestlé) ====
INSERT INTO brands (name, account_id, code) VALUES
  ('KitKat',     (SELECT id FROM accounts WHERE name='Nestlé'), 'KIT'),
  ('Cocosette',  (SELECT id FROM accounts WHERE name='Nestlé'), 'COC'),
  ('MILO',       (SELECT id FROM accounts WHERE name='Nestlé'), 'MIL'),
  ('NDG',        (SELECT id FROM accounts WHERE name='Nestlé'), 'NDG'),
  ('MAGGI',      (SELECT id FROM accounts WHERE name='Nestlé'), 'MAG'),
  ('La Lechera', (SELECT id FROM accounts WHERE name='Nestlé'), 'LL'),
  ('Nescafé',    (SELECT id FROM accounts WHERE name='Nestlé'), 'NES');

COMMIT;