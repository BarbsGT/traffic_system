-- Migration: Add task detail fields for Mesa de Tráfico Viva
-- Run this in Supabase SQL Editor

-- Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivery_timeliness TEXT DEFAULT 'UNKNOWN';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'UNKNOWN';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Add check constraints for enum-like fields
DO $$ BEGIN
  ALTER TABLE tasks ADD CONSTRAINT chk_delivery_timeliness
    CHECK (delivery_timeliness IN ('ON_TIME', 'LATE', 'AT_RISK', 'UNKNOWN'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE tasks ADD CONSTRAINT chk_compliance_status
    CHECK (compliance_status IN ('APPROVED', 'PENDING', 'ISSUES', 'UNKNOWN'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_delivery_timeliness ON tasks(delivery_timeliness);
CREATE INDEX IF NOT EXISTS idx_tasks_compliance_status ON tasks(compliance_status);
