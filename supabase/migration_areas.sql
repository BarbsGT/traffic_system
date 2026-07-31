-- Areas catalog
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "areas_select" ON areas;
DROP POLICY IF EXISTS "areas_insert" ON areas;
DROP POLICY IF EXISTS "areas_update" ON areas;
DROP POLICY IF EXISTS "areas_delete" ON areas;

CREATE POLICY "areas_select" ON areas FOR SELECT USING (true);
CREATE POLICY "areas_insert" ON areas FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "areas_update" ON areas FOR UPDATE USING (is_director());
CREATE POLICY "areas_delete" ON areas FOR DELETE USING (is_superadmin());

INSERT INTO areas (name, code) VALUES
  ('Special Projects', 'SP'),
  ('Social Media', 'SM'),
  ('Paid Media', 'PM'),
  ('Marketing Ops', 'MO')
ON CONFLICT (name) DO NOTHING;
