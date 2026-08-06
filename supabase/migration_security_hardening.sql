-- =============================================
-- SECURITY HARDENING — fix hallazgos 1 y 2
-- 1) Escalada de privilegios: usuarios no pueden cambiar su propio rol/estado/manager
-- 2) Aislamiento de lecturas: solo authenticated + visibilidad por cuenta/equipo/rol
-- PREREQUISITOS: migration_rbac_v3, migration_unify_projects,
--                migration_directors_account, migration_profile_accounts_manager
-- =============================================

-- =============================================
-- HELPER: can_access_account / can_access_project
-- =============================================
CREATE OR REPLACE FUNCTION can_access_account(aid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF is_sysadmin() THEN RETURN TRUE; END IF;
  IF aid IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM profile_accounts WHERE account_id = aid AND profile_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM directors WHERE account_id = aid AND profile_id = auth.uid() AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM profile_teams pt JOIN teams t ON t.id = pt.team_id
    WHERE pt.profile_id = auth.uid() AND t.account_id = aid
  );
END;
$$;

CREATE OR REPLACE FUNCTION can_access_project(pid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p projects%ROWTYPE;
BEGIN
  IF is_sysadmin() THEN RETURN TRUE; END IF;
  SELECT * INTO p FROM projects WHERE id = pid;
  IF p IS NULL THEN RETURN FALSE; END IF;
  IF p.owner_id = auth.uid() THEN RETURN TRUE; END IF;
  -- DIRECTOR ve todos los proyectos de sus cuentas; COLABORADOR SOLO los proyectos
  -- donde está asignado (owner o con tareas asignadas a su id).
  IF is_director() AND p.account_id IS NOT NULL AND can_access_account(p.account_id) THEN RETURN TRUE; END IF;
  RETURN EXISTS (SELECT 1 FROM tasks WHERE project_id = pid AND assignee_id = auth.uid());
END;
$$;

-- =============================================
-- FIX 1: Escalada de privilegios en profiles
-- =============================================
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
    AND manager_id IS NOT DISTINCT FROM (SELECT manager_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid() AND role = 'COLABORADOR');

-- Trigger de defensa en profundidad (nunca cambiar rol/estado/manager sin ser sysadmin)
CREATE OR REPLACE FUNCTION protect_profile_privileges()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT is_sysadmin() AND (
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.is_active IS DISTINCT FROM OLD.is_active OR
    NEW.manager_id IS DISTINCT FROM OLD.manager_id
  ) THEN
    RAISE EXCEPTION 'No puedes modificar rol, estado o manager de tu propio perfil';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON profiles;
CREATE TRIGGER trg_protect_profile_privileges
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_privileges();

-- =============================================
-- FIX 2: Aislamiento de lecturas (authenticated + acceso por cuenta/proyecto)
-- =============================================

-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');

-- PROJECTS
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (auth.role() = 'authenticated' AND can_access_project(id));
CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (is_director() AND (account_id IS NULL OR can_access_account(account_id)));
CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (is_director() AND (account_id IS NULL OR can_access_account(account_id)));

-- TASKS
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated' AND (project_id IS NULL OR can_access_project(project_id)));
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (is_director() AND (project_id IS NULL OR can_access_project(project_id)));
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (auth.uid() = assignee_id OR auth.uid() = created_by OR can_access_project(project_id));

-- COMMENTS
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_update" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      author_id = auth.uid() OR is_sysadmin() OR task_id IS NULL OR
      EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND can_access_project(t.project_id))
    )
  );
CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND (
      task_id IS NULL OR
      EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND can_access_project(t.project_id))
    )
  );
CREATE POLICY "comments_update" ON comments
  FOR UPDATE USING (author_id = auth.uid() OR is_sysadmin());
CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (author_id = auth.uid() OR is_superadmin());

-- PROJECT MESSAGES
DROP POLICY IF EXISTS "messages_select" ON project_messages;
DROP POLICY IF EXISTS "messages_insert" ON project_messages;
DROP POLICY IF EXISTS "messages_delete" ON project_messages;
CREATE POLICY "messages_select" ON project_messages
  FOR SELECT USING (auth.role() = 'authenticated' AND can_access_project(project_id));
CREATE POLICY "messages_insert" ON project_messages
  FOR INSERT WITH CHECK (author_id = auth.uid() AND can_access_project(project_id));
CREATE POLICY "messages_delete" ON project_messages
  FOR DELETE USING (author_id = auth.uid() OR is_sysadmin());

-- CHAT
DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON chat_messages;
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "chat_messages_delete" ON chat_messages FOR DELETE USING (profile_id = auth.uid());

-- TASK HISTORY (auditoría: solo sysadmin puede escribir)
DROP POLICY IF EXISTS "task_history_select" ON task_history;
DROP POLICY IF EXISTS "task_history_insert" ON task_history;
CREATE POLICY "task_history_select" ON task_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "task_history_insert" ON task_history FOR INSERT WITH CHECK (is_sysadmin());

-- CATALOGOS (lectura a authenticated, escritura según rbac_v3)
DROP POLICY IF EXISTS "catalogos_select" ON agencies;
DROP POLICY IF EXISTS "accounts_select" ON accounts;
DROP POLICY IF EXISTS "teams_select" ON teams;
DROP POLICY IF EXISTS "directors_select" ON directors;
DROP POLICY IF EXISTS "domains_select" ON domains;
DROP POLICY IF EXISTS "excel_columns_select" ON excel_columns;
DROP POLICY IF EXISTS "areas_select" ON areas;

CREATE POLICY "catalogos_select" ON agencies FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    is_sysadmin() OR EXISTS (
      SELECT 1 FROM account_agencies aa
      JOIN accounts ac ON ac.id = aa.account_id
      WHERE aa.agency_id = agencies.id AND can_access_account(aa.account_id)
    )
  )
);
CREATE POLICY "accounts_select" ON accounts
  FOR SELECT USING (auth.role() = 'authenticated' AND can_access_account(id));
CREATE POLICY "teams_select" ON teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "directors_select" ON directors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "domains_select" ON domains FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "excel_columns_select" ON excel_columns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "areas_select" ON areas FOR SELECT USING (auth.role() = 'authenticated');

-- ASIGNACIONES (lectura a authenticated; insert/delete según rbac_v3)
DROP POLICY IF EXISTS "profile_accounts_select" ON profile_accounts;
DROP POLICY IF EXISTS "profile_teams_select" ON profile_teams;
CREATE POLICY "profile_accounts_select" ON profile_accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profile_teams_select" ON profile_teams FOR SELECT USING (auth.role() = 'authenticated');

-- UPDATE de asignaciones y perfiles solo para sysadmin (necesario para CRUD de usuarios admin)
DROP POLICY IF EXISTS "profile_accounts_update" ON profile_accounts;
CREATE POLICY "profile_accounts_update" ON profile_accounts
  FOR UPDATE USING (is_sysadmin())
  WITH CHECK (is_sysadmin());

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_sysadmin())
  WITH CHECK (is_sysadmin());

-- =============================================
-- END
-- =============================================
