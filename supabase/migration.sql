-- =============================================
-- AgencyGrid — Visibilidad 360° para tu agencia
-- Full Schema Migration
-- =============================================

-- ENUMS (idempotent)
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

-- PROFILES (extends auth.users)
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

-- RLS POLICIES

-- Profiles: users can read all profiles, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Projects: authenticated users can read, SUPERADMIN/SYSADMIN can CRUD
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

-- Tasks: all authenticated can read, SUPERADMIN/SYSADMIN/DIRECTOR can insert, assigned users can update
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR'))
);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
  auth.uid() = assignee_id OR
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'))
);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'))
);

-- Comments: all authenticated can read, own insert/update/delete
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (author_id = auth.uid());

-- Messages: member can CRUD
CREATE POLICY "messages_select" ON project_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND (
      owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM tasks WHERE project_id = projects.id AND assignee_id = auth.uid())
    )
  )
);
CREATE POLICY "messages_insert" ON project_messages FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "messages_delete" ON project_messages FOR DELETE USING (author_id = auth.uid());

-- CREATE PROFILES TRIGGER
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
