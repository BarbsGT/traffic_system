-- Seed data for catalogos
-- UUIDs use valid hex chars

-- Agencies
INSERT INTO agencies (id, name, code) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Agencia Central', 'AC');
INSERT INTO agencies (id, name, code) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'Agencia Digital', 'AD');
INSERT INTO agencies (id, name, code) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'Agencia Creativa', 'ACR');

-- Accounts
INSERT INTO accounts (id, name, agency_id, code) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Cuenta Principal', 'a0000000-0000-0000-0000-000000000001', 'CP-001');
INSERT INTO accounts (id, name, agency_id, code) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'Cuenta Digital', 'a0000000-0000-0000-0000-000000000002', 'CD-001');
INSERT INTO accounts (id, name, agency_id, code) VALUES
  ('c0000000-0000-0000-0000-000000000003', 'Cuenta Creativa', 'a0000000-0000-0000-0000-000000000003', 'CC-001');

-- Teams
INSERT INTO teams (id, name, account_id, code) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Equipo Alpha', 'c0000000-0000-0000-0000-000000000001', 'EA-001');
INSERT INTO teams (id, name, account_id, code) VALUES
  ('e0000000-0000-0000-0000-000000000002', 'Equipo Beta', 'c0000000-0000-0000-0000-000000000001', 'EB-001');
INSERT INTO teams (id, name, account_id, code) VALUES
  ('e0000000-0000-0000-0000-000000000003', 'Equipo Digital', 'c0000000-0000-0000-0000-000000000002', 'ED-001');
