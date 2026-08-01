-- Migration: Add completed_at + delivered_at to tasks and projects
-- Run this in Supabase SQL Editor

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delivered_at DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivered_at DATE;

-- Backfill for already-completed tasks (best effort using updated_at)
UPDATE tasks
SET completed_at = COALESCE(completed_at, updated_at),
    delivered_at = COALESCE(delivered_at, updated_at::date)
WHERE status = 'COMPLETED';

-- Backfill for projects already Approved or Send
UPDATE projects
SET delivered_at = COALESCE(delivered_at, updated_at::date)
WHERE creative_status IN ('Approved', 'Send') AND delivered_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_delivered_at ON tasks(delivered_at);
CREATE INDEX IF NOT EXISTS idx_projects_delivered_at ON projects(delivered_at);

