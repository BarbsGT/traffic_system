-- Domains table for multi-tenant email validation
-- Each domain represents an organization/company allowed to use the system

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

-- Seed domains for Grupo Lo Bueno and related organizations
INSERT INTO domains (id, name, display_name) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'lobueno.co', 'Grupo Lo Bueno'),
  ('d0000000-0000-0000-0000-000000000002', 'agenciacentral.com', 'Agencia Central'),
  ('d0000000-0000-0000-0000-000000000003', 'agenciadigital.mx', 'Agencia Digital'),
  ('d0000000-0000-0000-0000-000000000004', 'creativastudio.com', 'Creativa Studio');

-- Domain validation helper
CREATE OR REPLACE FUNCTION is_valid_domain(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM domains
    WHERE is_active = true
    AND email LIKE '%@' || name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
