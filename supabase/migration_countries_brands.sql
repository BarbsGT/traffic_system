-- Countries catalog
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "countries_select" ON countries;
DROP POLICY IF EXISTS "countries_insert" ON countries;
DROP POLICY IF EXISTS "countries_update" ON countries;
DROP POLICY IF EXISTS "countries_delete" ON countries;

CREATE POLICY "countries_select" ON countries FOR SELECT USING (true);
CREATE POLICY "countries_insert" ON countries FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "countries_update" ON countries FOR UPDATE USING (is_sysadmin());
CREATE POLICY "countries_delete" ON countries FOR DELETE USING (is_superadmin());

INSERT INTO countries (name, code) VALUES
  ('Colombia', 'CO'),
  ('Ecuador', 'EC'),
  ('Perú', 'PE')
ON CONFLICT (name) DO NOTHING;

-- Brands catalog (marcas por cuenta cliente)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  code TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_select" ON brands;
DROP POLICY IF EXISTS "brands_insert" ON brands;
DROP POLICY IF EXISTS "brands_update" ON brands;
DROP POLICY IF EXISTS "brands_delete" ON brands;

CREATE POLICY "brands_select" ON brands FOR SELECT USING (true);
CREATE POLICY "brands_insert" ON brands FOR INSERT WITH CHECK (is_sysadmin());
CREATE POLICY "brands_update" ON brands FOR UPDATE USING (is_sysadmin());
CREATE POLICY "brands_delete" ON brands FOR DELETE USING (is_superadmin());