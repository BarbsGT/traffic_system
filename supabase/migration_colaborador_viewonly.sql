-- =============================================
-- AgencyGrid — Fase C: COLABORADOR solo lectura + comentarios
-- -------------------------------------------------------------
-- COLABORADOR SOLO VE y comenta en la matriz de tráfico:
--   * NO crea proyectos ni tareas (crear sigue siendo is_director).
--   * NO edita tareas: ni status, ni fechas, ni asignación, ni prioridad,
--     ni categorización, ni descripción, ni títulos.
--   * SÍ puede ver todo (select sigue can_access_project) y ENVIAR/RECIBIR
--     comentarios en tareas (insert/select de comments sin restricción extra).
-- Su prioridad se da por el rol (is_director incluye GERENTE/DIRECTOR).
-- =============================================

BEGIN;

-- =============================================
-- 1) TASKS: UPDATE restringido a is_director() (GERENTE/DIRECTOR/SYSADMIN/SUPERADMIN)
--    y además dentro de su cuenta/proyecto. COLABORADOR NO edita tareas.
--    (Antes: assignee_id/created_by podían editar su tarea.)
-- =============================================
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    is_director() AND (project_id IS NULL OR can_access_project(project_id))
  )
  WITH CHECK (
    is_director() AND (project_id IS NULL OR can_access_project(project_id))
  );

-- =============================================
-- 2) TASKS: INSERT/DELETE siguen siendo de director (ya correctos). Refuerzo.
-- =============================================
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (
    is_director() AND (project_id IS NULL OR can_access_project(project_id))
  );

DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (is_sysadmin());

-- =============================================
-- 3) COMMENTS: COLABORADOR puede VER y ESCRIBIR comentarios.
--    Select: cualquier authenticated con acceso al proyecto de la tarea.
--    Insert: cualquier authenticated cuyo author sea él mismo y con acceso.
--    (Sin cambios vs hardening — se reafirman para claridad.)
-- =============================================
DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      author_id = auth.uid() OR is_sysadmin() OR task_id IS NULL OR
      EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND can_access_project(t.project_id))
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND (
      task_id IS NULL OR
      EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND can_access_project(t.project_id))
    )
  );

-- Editar/borrar comentarios: solo el autor o sysadmin.
DROP POLICY IF EXISTS "comments_update" ON comments;
CREATE POLICY "comments_update" ON comments
  FOR UPDATE USING (author_id = auth.uid() OR is_sysadmin());

DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (author_id = auth.uid() OR is_superadmin());

COMMIT;