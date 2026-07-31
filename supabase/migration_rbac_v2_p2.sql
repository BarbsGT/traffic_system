-- RBAC v2 Part 2: RLS policies with helper functions

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPERADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_sysadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_director()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Refresh policies to use helper functions
DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (is_sysadmin());

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (is_sysadmin());

DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (is_director());

DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
  auth.uid() = assignee_id OR is_sysadmin()
);
