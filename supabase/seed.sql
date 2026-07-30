-- Seed data for AgencyGrid
-- All UUIDs use valid hex chars (0-9, a-f)

-- Note: auth.users must have records first (handled by Supabase Auth)
-- These seeds assume profiles are created via the trigger

-- Projects (using f0000000-... pattern)
INSERT INTO projects (id, name, description, status, priority, start_date, end_date, color) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Campaña Verano 2025', 'Campaña publicitaria para temporada de verano', 'IN_PROGRESS', 'HIGH', '2025-06-01', '2025-09-30', '#0ea5e9'),
  ('f0000000-0000-0000-0000-000000000002', 'Rediseño Plataforma', 'Rediseño completo de la plataforma digital', 'PENDING', 'URGENT', '2025-07-01', '2025-12-31', '#8b5cf6'),
  ('f0000000-0000-0000-0000-000000000003', 'Lanzamiento App Mobile', 'Desarrollo y lanzamiento de app móvil', 'IN_PROGRESS', 'HIGH', '2025-05-15', '2025-11-30', '#10b981'),
  ('f0000000-0000-0000-0000-000000000004', 'Integración CRM', 'Integración con sistema CRM corporativo', 'PENDING', 'MEDIUM', '2025-08-01', '2025-10-31', '#f59e0b'),
  ('f0000000-0000-0000-0000-000000000005', 'SEO Optimization', 'Mejora de posicionamiento SEO', 'COMPLETED', 'MEDIUM', '2025-01-15', '2025-06-30', '#06b6d4');

-- Tasks
INSERT INTO tasks (id, title, description, status, priority, project_id, estimated_hours, start_date, due_date) VALUES
  ('f0000000-0000-0000-0000-000000000010', 'Diseño de banners', 'Crear banners para campaña de verano', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000001', 40, '2025-06-01', '2025-07-15'),
  ('f0000000-0000-0000-0000-000000000011', 'Redacción de copies', 'Escribir textos publicitarios', 'PENDING', 'MEDIUM', 'f0000000-0000-0000-0000-000000000001', 20, '2025-06-15', '2025-07-30'),
  ('f0000000-0000-0000-0000-000000000012', 'Wireframes nueva plataforma', 'Diseñar wireframes', 'COMPLETED', 'URGENT', 'f0000000-0000-0000-0000-000000000002', 30, '2025-07-01', '2025-07-20'),
  ('f0000000-0000-0000-0000-000000000013', 'Prototipo funcional', 'Desarrollar prototipo interactivo', 'BLOCKED', 'HIGH', 'f0000000-0000-0000-0000-000000000002', 80, '2025-07-21', '2025-09-15'),
  ('f0000000-0000-0000-0000-000000000014', 'Configurar CI/CD', 'Pipeline de integración continua', 'IN_PROGRESS', 'HIGH', 'f0000000-0000-0000-0000-000000000003', 16, '2025-05-15', '2025-06-30'),
  ('f0000000-0000-0000-0000-000000000015', 'Diseño UI/UX App', 'Diseño de interfaz de usuario', 'COMPLETED', 'URGENT', 'f0000000-0000-0000-0000-000000000003', 60, '2025-05-15', '2025-07-15'),
  ('f0000000-0000-0000-0000-000000000016', 'API endpoints CRM', 'Desarrollar endpoints de integración', 'PENDING', 'MEDIUM', 'f0000000-0000-0000-0000-000000000004', 40, '2025-08-01', '2025-09-15'),
  ('f0000000-0000-0000-0000-000000000017', 'Keyword research', 'Investigación de palabras clave', 'COMPLETED', 'MEDIUM', 'f0000000-0000-0000-0000-000000000005', 10, '2025-01-15', '2025-02-28');

-- Comments
INSERT INTO comments (id, task_id, content) VALUES
  ('f0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000010', 'Revisar brief con el cliente antes de comenzar'),
  ('f0000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000013', 'Esperando aprobación de recursos adicionales');
