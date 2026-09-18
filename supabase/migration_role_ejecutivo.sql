-- Add new role EJECUTIVO to enum and grant capabilities
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname='user_role' AND e.enumlabel='EJECUTIVO') THEN
    ALTER TYPE public.user_role ADD VALUE 'EJECUTIVO';
  END IF;
END $$;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_ejecutivo()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'EJECUTIVO');
$$;

-- can_access_project: treat EJECUTIVO like DIRECTOR
CREATE OR REPLACE FUNCTION public.can_access_project(pid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  p projects%ROWTYPE;
BEGIN
  IF is_sysadmin() THEN RETURN TRUE; END IF;
  SELECT * INTO p FROM projects WHERE id = pid;
  IF p IS NULL THEN RETURN FALSE; END IF;
  IF p.owner_id = auth.uid() THEN RETURN TRUE; END IF;
  IF (is_director() OR is_ejecutivo()) AND p.account_id IS NOT NULL AND can_access_account(p.account_id) THEN RETURN TRUE; END IF;
  RETURN EXISTS (SELECT 1 FROM tasks WHERE project_id = pid AND assignee_id = auth.uid());
END;
$$;

-- Tasks policies for EJECUTIVO (create/update/assign within accessible projects)
DO $$ BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid='tasks'::regclass AND polname='tasks_select_ejecutivo'
  ) THEN
    CREATE POLICY tasks_select_ejecutivo ON public.tasks FOR SELECT TO authenticated USING (
      (public.is_ejecutivo() AND public.can_access_project(project_id))
    );
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid='tasks'::regclass AND polname='tasks_insert_ejecutivo'
  ) THEN
    CREATE POLICY tasks_insert_ejecutivo ON public.tasks FOR INSERT TO authenticated WITH CHECK (
      (public.is_ejecutivo() AND public.can_access_project(project_id))
    );
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polrelid='tasks'::regclass AND polname='tasks_update_ejecutivo'
  ) THEN
    CREATE POLICY tasks_update_ejecutivo ON public.tasks FOR UPDATE TO authenticated USING (
      (public.is_ejecutivo() AND public.can_access_project(project_id))
    );
  END IF;
END $$;
