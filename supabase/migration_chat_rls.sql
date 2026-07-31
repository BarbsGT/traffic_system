-- Chat RLS with helper functions

CREATE OR REPLACE FUNCTION is_project_member(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      p.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.project_id = p.id AND t.assignee_id = auth.uid()
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "messages_select" ON project_messages;
CREATE POLICY "messages_select" ON project_messages FOR SELECT
USING (is_project_member(project_id));

DROP POLICY IF EXISTS "messages_insert" ON project_messages;
CREATE POLICY "messages_insert" ON project_messages FOR INSERT
WITH CHECK (author_id = auth.uid() AND is_project_member(project_id));
