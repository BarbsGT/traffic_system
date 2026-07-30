-- =============================================
-- Kairos — Complete Migration (ALL-IN-ONE)
-- Execute this file in Supabase Dashboard > SQL Editor
-- Run each section in order (separated by comments)
-- =============================================

-- =============================================
-- PART 1: Base Schema (migration.sql)
-- =============================================

-- ENUMS (idempotent: IF NOT EXISTS)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR', 'COLABORADOR');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'REVIEW');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  END IF;
END $$;

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'COLABORADOR',
  position TEXT DEFAULT '',
  position_description TEXT DEFAULT '',
  manager_id UUID REFERENCES profiles(id),
  capacity INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status task_status DEFAULT 'PENDING',
  priority task_priority DEFAULT 'MEDIUM',
  start_date DATE,
  end_date DATE,
  owner_id UUID REFERENCES profiles(id),
  parent_id UUID REFERENCES projects(id),
  color TEXT DEFAULT '#0ea5e9',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- TASKS
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status task_status DEFAULT 'PENDING',
  priority task_priority DEFAULT 'MEDIUM',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  start_date DATE,
  due_date DATE,
  estimated_hours NUMERIC(6,2),
  parent_task_id UUID REFERENCES tasks(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- COMMENTS
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- PROJECT MESSAGES (chat)
CREATE TABLE project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- INDEXES
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_messages_project ON project_messages(project_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- REAL TIME
ALTER publication supabase_realtime ADD TABLE comments;
ALTER publication supabase_realtime ADD TABLE project_messages;
ALTER publication supabase_realtime ADD TABLE tasks;

-- RLS POLICIES (BASE)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "projects_select" ON projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'))
);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'))
);
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'))
);
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR'))
);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
  auth.uid() = assignee_id OR auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'))
);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'))
);
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (author_id = auth.uid());
CREATE POLICY "messages_select" ON project_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    owner_id = auth.uid() OR EXISTS (SELECT 1 FROM tasks WHERE project_id = projects.id AND assignee_id = auth.uid())
  ))
);
CREATE POLICY "messages_insert" ON project_messages FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "messages_delete" ON project_messages FOR DELETE USING (author_id = auth.uid());

-- TRIGGER: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- PART 2: Catalogos (migration_catalogos.sql)
-- =============================================

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  director_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE directors ENABLE ROW LEVEL SECURITY;

-- Catalogos RLS
CREATE POLICY "catalogos_select" ON agencies FOR SELECT USING (true);
CREATE POLICY "catalogos_insert" ON agencies FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "catalogos_update" ON agencies FOR UPDATE USING (is_sysadmin());
CREATE POLICY "catalogos_delete" ON agencies FOR DELETE USING (is_superadmin());
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (true);
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (is_sysadmin());
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING (is_superadmin());
CREATE POLICY "teams_select" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (is_sysadmin());
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (is_superadmin());
CREATE POLICY "directors_select" ON directors FOR SELECT USING (true);
CREATE POLICY "directors_insert" ON directors FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "directors_update" ON directors FOR UPDATE USING (is_sysadmin());
CREATE POLICY "directors_delete" ON directors FOR DELETE USING (is_superadmin());

CREATE INDEX idx_accounts_agency ON accounts(agency_id);
CREATE INDEX idx_teams_account ON teams(account_id);
CREATE INDEX idx_teams_director ON teams(director_id);
CREATE INDEX idx_directors_profile ON directors(profile_id);

-- =============================================
-- PART 3: User Assignments (migration_user_assignments.sql)
-- =============================================

CREATE TABLE profile_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, account_id)
);
ALTER TABLE profile_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE profile_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, team_id)
);
ALTER TABLE profile_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_accounts_select" ON profile_accounts FOR SELECT USING (true);
CREATE POLICY "profile_accounts_insert" ON profile_accounts FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "profile_accounts_delete" ON profile_accounts FOR DELETE USING (is_sysadmin());
CREATE POLICY "profile_teams_select" ON profile_teams FOR SELECT USING (true);
CREATE POLICY "profile_teams_insert" ON profile_teams FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "profile_teams_delete" ON profile_teams FOR DELETE USING (is_sysadmin());

CREATE INDEX idx_profile_accounts_profile ON profile_accounts(profile_id);
CREATE INDEX idx_profile_accounts_account ON profile_accounts(account_id);
CREATE INDEX idx_profile_teams_profile ON profile_teams(profile_id);
CREATE INDEX idx_profile_teams_team ON profile_teams(team_id);

-- =============================================
-- PART 4: Chat Tables (migration_chat.sql)
-- =============================================

CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

ALTER publication supabase_realtime ADD TABLE chat_messages;
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT USING (true);
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "chat_messages_delete" ON chat_messages FOR DELETE USING (profile_id = auth.uid());
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- =============================================
-- PART 5: Chat RLS (migration_chat_rls.sql)
-- =============================================

CREATE OR REPLACE FUNCTION is_project_member(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (p.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assignee_id = auth.uid()))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "messages_select" ON project_messages;
DROP POLICY IF EXISTS "messages_insert" ON project_messages;
CREATE POLICY "messages_select" ON project_messages FOR SELECT USING (is_project_member(project_id));
CREATE POLICY "messages_insert" ON project_messages FOR INSERT WITH CHECK (author_id = auth.uid() AND is_project_member(project_id));

-- =============================================
-- PART 6: Audit Logs (migration_audit_logs.sql)
-- =============================================

CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  changed_by UUID REFERENCES profiles(id) NOT NULL,
  change_type TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_history_select" ON task_history FOR SELECT USING (true);
CREATE POLICY "task_history_insert" ON task_history FOR INSERT WITH CHECK (true);
CREATE INDEX idx_task_history_task ON task_history(task_id);

CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_task_history
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_change();

-- =============================================
-- PART 7: RBAC v2 Helper Functions
-- =============================================

-- Note: user_role type is already created in PART 1 with all values.

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPERADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_sysadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_director()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PART 8: Domains (migration_domains.sql)
-- =============================================

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domains_select" ON domains FOR SELECT USING (true);
CREATE POLICY "domains_insert" ON domains FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "domains_update" ON domains FOR UPDATE USING (is_sysadmin());
CREATE POLICY "domains_delete" ON domains FOR DELETE USING (is_superadmin());

INSERT INTO domains (id, name, display_name) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'lobueno.co', 'Grupo Lo Bueno'),
  ('d0000000-0000-0000-0000-000000000002', 'semillasrt.com', 'Semillas RT'),
  ('d0000000-0000-0000-0000-000000000003', 'agenciacentral.com', 'Agencia Central'),
  ('d0000000-0000-0000-0000-000000000004', 'agenciadigital.mx', 'Agencia Digital'),
  ('d0000000-0000-0000-0000-000000000005', 'creativastudio.com', 'Creativa Studio');

CREATE OR REPLACE FUNCTION is_valid_domain(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM domains WHERE is_active = true AND email LIKE '%@' || name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PART 9: Excel Columns (migration_excel_columns.sql)
-- =============================================

CREATE TABLE excel_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE excel_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "excel_columns_select" ON excel_columns FOR SELECT USING (true);
CREATE POLICY "excel_columns_all" ON excel_columns FOR ALL USING (is_sysadmin());

INSERT INTO excel_columns (table_name, column_name, display_name, sort_order) VALUES
  ('tasks', 'title', 'Título', 1),
  ('tasks', 'status', 'Estado', 2),
  ('tasks', 'priority', 'Prioridad', 3),
  ('tasks', 'assignee_id', 'Asignado', 4),
  ('tasks', 'due_date', 'Fecha Límite', 5),
  ('tasks', 'estimated_hours', 'Horas Est.', 6);

-- =============================================
-- PART 10: Grant User Access (grant_user_access.sql)
-- =============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- END OF MIGRATION
-- =============================================
-- NEXT STEPS:
-- 1. Create users in Supabase Auth Dashboard
-- 2. Run seed_comprehensive.sql to populate data
-- 3. Assign profiles to accounts/teams
-- =============================================
