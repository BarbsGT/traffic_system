-- Excel columns for export functionality
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
CREATE POLICY "excel_columns_all" ON excel_columns FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN'))
);

-- Default columns
INSERT INTO excel_columns (table_name, column_name, display_name, sort_order) VALUES
  ('tasks', 'title', 'Título', 1),
  ('tasks', 'status', 'Estado', 2),
  ('tasks', 'priority', 'Prioridad', 3),
  ('tasks', 'assignee_id', 'Asignado', 4),
  ('tasks', 'due_date', 'Fecha Límite', 5),
  ('tasks', 'estimated_hours', 'Horas Est.', 6);
