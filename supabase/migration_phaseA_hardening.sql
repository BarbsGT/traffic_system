-- =============================================
-- FASE A — SECURITY HARDENING (refuerzo, no rompe nada)
-- Objetivos:
--  1) WITH CHECK en updates de tasks/projects (evitar mover tareas/cambiar assignee fuera de alcance)
--  2) Asignaciones (profile_accounts/profile_teams) SOLO sysadmin (cerrar bypass multitenencia)
--  3) CHAT: aislar lecturas/inserciones por membresía de cuenta/proyecto
--  4) search_path explícito en funciones SECURITY DEFINER que faltan
--  5) Índices que la app sí consulta y no existen
-- PREREQUISITOS: rbac_v3, security_hardening, unify_projects,
--                can_access_manager, gerente_rol (aplicadas en orden)
-- =============================================

-- =============================================
-- 1) TASKS: añade WITH CHECK (mismo predicado que USING).
--    Colaborador solo puede editar si sigue siendo asignado/responsable o el proyecto
--    sigue en su alcance => no puede reasignar assignee ni mover task a otro proyecto.
-- =============================================
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    auth.uid() = assignee_id OR auth.uid() = created_by OR can_access_project(project_id)
  )
  WITH CHECK (
    auth.uid() = assignee_id OR auth.uid() = created_by OR can_access_project(project_id)
  );

-- PROJECTS: añade WITH CHECK (misma predicado que USING) para no cambiar account/owner fuera de alcance
DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (
    is_director() AND (account_id IS NULL OR can_access_account(account_id))
  )
  WITH CHECK (
    is_director() AND (account_id IS NULL OR can_access_account(account_id))
  );

-- =============================================
-- 2) ASIGNACIONES (perfile_accounts / profile_teams): solo sysadmin.
--    Cierra el bypass multitenencia (dir. no puede enlazar a otra cuenta).
--    El flujo admin-users ya es solo SUPERADMIN/SYSADMIN en la UI.
-- =============================================
DROP POLICY IF EXISTS "profile_accounts_insert" ON profile_accounts;
DROP POLICY IF EXISTS "profile_accounts_delete" ON profile_accounts;
CREATE POLICY "profile_accounts_insert" ON profile_accounts
  FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "profile_accounts_delete" ON profile_accounts
  FOR DELETE USING (is_sysadmin());

DROP POLICY IF EXISTS "profile_teams_insert" ON profile_teams;
DROP POLICY IF EXISTS "profile_teams_delete" ON profile_teams;
CREATE POLICY "profile_teams_insert" ON profile_teams
  FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "profile_teams_delete" ON profile_teams
  FOR DELETE USING (is_sysadmin());

-- =============================================
-- 3) CHAT: aislamiento por membresía de proyecto (antes: todo authenticated lee/pública).
--    chat_rooms (project_id) y chat_messages (room_id → chat_rooms → project_id).
-- =============================================
DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT USING (
  auth.role() = 'authenticated' AND can_access_project(project_id)
);

DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON chat_messages;

CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = chat_messages.room_id AND can_access_project(cr.project_id)
  )
);

CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (
  profile_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = chat_messages.room_id AND can_access_project(cr.project_id)
  )
);

CREATE POLICY "chat_messages_delete" ON chat_messages FOR DELETE USING (
  profile_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = chat_messages.room_id AND can_access_project(cr.project_id)
  )
);

-- =============================================
-- 4) search_path explícito en funciones SECURITY DEFINER que aún lo tenían vacío
--    (evita hijacking de search_path al ejecutar con privilegios elevados).
-- =============================================
CREATE OR REPLACE FUNCTION is_project_member(project_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (p.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assignee_id = auth.uid()))
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_valid_domain(email TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM domains WHERE is_active = true AND email LIKE '%@' || name);
END;
$$;

CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, old_data, new_data)
    VALUES (NEW.id, COALESCE(auth.uid(), NEW.assignee_id), TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, old_data, new_data)
    VALUES (NEW.id, COALESCE(auth.uid(), NEW.created_by), TG_OP, NULL, row_to_json(NEW)::jsonb);
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================
-- 5) Índices faltantes que la app sí consulta
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profile_accounts_manager ON profile_accounts(manager_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_id);

-- =============================================
-- END FASE A
-- =============================================