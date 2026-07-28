-- Audit logs: task_history
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

-- Trigger function to log task changes
CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, old_data, new_data)
    VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.assignee_id),
      TG_OP,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, old_data, new_data)
    VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.created_by),
      TG_OP,
      NULL,
      row_to_json(NEW)::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_task_history
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_change();
