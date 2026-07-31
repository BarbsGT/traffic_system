-- =============================================
-- RBAC v3: Unified Role-Based Access Control
-- SUPERADMIN: full CRUD on everything
-- SYSADMIN:  full CRUD on everything except delete on critical tables
-- DIRECTOR:  CRUD projects/tasks, manage assignments
-- COLABORADOR: view, update own tasks
-- =============================================

-- 1. Fix helper functions with search_path (idempotent)
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPERADMIN');
END;
$$;

CREATE OR REPLACE FUNCTION is_sysadmin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'));
END;
$$;

CREATE OR REPLACE FUNCTION is_director()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR'));
END;
$$;

-- Fix handle_new_user in migration_all.sql (idempotent)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- 2. PROFILES RLS
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- SUPERADMIN/SYSADMIN can update any profile (role changes, etc.)
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_sysadmin())
  WITH CHECK (is_sysadmin());

-- 3. PROJECTS RLS — DIRECTOR can now CRUD
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (is_director());

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (is_director());

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (is_sysadmin());

-- 4. TASKS RLS — DIRECTOR full CRUD, COLABORADOR can update own
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (is_director());

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    auth.uid() = assignee_id OR
    auth.uid() = created_by OR
    is_director()
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (is_sysadmin());

-- 5. COMMENTS RLS — DIRECTOR can manage any comment
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_update" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;

CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (author_id = auth.uid() OR is_director());

CREATE POLICY "comments_update" ON comments
  FOR UPDATE USING (author_id = auth.uid() OR is_director());

CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (author_id = auth.uid() OR is_sysadmin());

-- 6. DIRECTORS RLS — SUPERADMIN/SYSADMIN can manage
DROP POLICY IF EXISTS "directors_insert" ON directors;
DROP POLICY IF EXISTS "directors_update" ON directors;
DROP POLICY IF EXISTS "directors_delete" ON directors;

CREATE POLICY "directors_insert" ON directors
  FOR INSERT WITH CHECK (is_sysadmin());

CREATE POLICY "directors_update" ON directors
  FOR UPDATE USING (is_sysadmin());

CREATE POLICY "directors_delete" ON directors
  FOR DELETE USING (is_superadmin());

-- 7. PROFILE_ACCOUNTS / PROFILE_TEAMS — DIRECTOR can assign
DROP POLICY IF EXISTS "profile_accounts_insert" ON profile_accounts;
DROP POLICY IF EXISTS "profile_accounts_delete" ON profile_accounts;

CREATE POLICY "profile_accounts_insert" ON profile_accounts
  FOR INSERT WITH CHECK (is_director());

CREATE POLICY "profile_accounts_delete" ON profile_accounts
  FOR DELETE USING (is_director());

DROP POLICY IF EXISTS "profile_teams_insert" ON profile_teams;
DROP POLICY IF EXISTS "profile_teams_delete" ON profile_teams;

CREATE POLICY "profile_teams_insert" ON profile_teams
  FOR INSERT WITH CHECK (is_director());

CREATE POLICY "profile_teams_delete" ON profile_teams
  FOR DELETE USING (is_director());

-- 8. CATALOGOS RLS — DIRECTOR can manage agencies/accounts/teams
DROP POLICY IF EXISTS "catalogos_insert" ON agencies;
DROP POLICY IF EXISTS "catalogos_update" ON agencies;
DROP POLICY IF EXISTS "catalogos_delete" ON agencies;

CREATE POLICY "catalogos_insert" ON agencies
  FOR INSERT WITH CHECK (is_sysadmin());

CREATE POLICY "catalogos_update" ON agencies
  FOR UPDATE USING (is_director());

CREATE POLICY "catalogos_delete" ON agencies
  FOR DELETE USING (is_superadmin());

DROP POLICY IF EXISTS "accounts_insert" ON accounts;
DROP POLICY IF EXISTS "accounts_update" ON accounts;
DROP POLICY IF EXISTS "accounts_delete" ON accounts;

CREATE POLICY "accounts_insert" ON accounts
  FOR INSERT WITH CHECK (is_sysadmin());

CREATE POLICY "accounts_update" ON accounts
  FOR UPDATE USING (is_director());

CREATE POLICY "accounts_delete" ON accounts
  FOR DELETE USING (is_superadmin());

DROP POLICY IF EXISTS "teams_insert" ON teams;
DROP POLICY IF EXISTS "teams_update" ON teams;
DROP POLICY IF EXISTS "teams_delete" ON teams;

CREATE POLICY "teams_insert" ON teams
  FOR INSERT WITH CHECK (is_sysadmin());

CREATE POLICY "teams_update" ON teams
  FOR UPDATE USING (is_director());

CREATE POLICY "teams_delete" ON teams
  FOR DELETE USING (is_superadmin());

-- 9. PROJECT MESSAGES — DIRECTOR can manage
DROP POLICY IF EXISTS "messages_select" ON project_messages;
DROP POLICY IF EXISTS "messages_insert" ON project_messages;
DROP POLICY IF EXISTS "messages_delete" ON project_messages;

CREATE POLICY "messages_select" ON project_messages
  FOR SELECT USING (is_project_member(project_id) OR is_director());

CREATE POLICY "messages_insert" ON project_messages
  FOR INSERT WITH CHECK (author_id = auth.uid() AND is_project_member(project_id));

CREATE POLICY "messages_delete" ON project_messages
  FOR DELETE USING (author_id = auth.uid() OR is_sysadmin());
