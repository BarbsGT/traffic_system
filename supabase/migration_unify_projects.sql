-- =============================================
-- Unify projects: merge ua_traffic_projects into projects
-- Adds type + account_id + UA-specific columns to projects
-- Drops ua_traffic_projects, ua_project_tasks, ua_task_comments
-- =============================================

-- 1. Add columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'ua_traffic'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_owner TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brief_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS resp_bt TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS working_days INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS launch_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS presentation_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS creative_status TEXT DEFAULT 'To do';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status_btlive TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status_migrante TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brief_link TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS decks_link TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_notes TEXT;

-- 2. Migrate UA projects into projects table (keep same IDs)
INSERT INTO projects (
  id, account_id, type, name, team_notes, status, client_owner, area, tier, budget,
  brief_date, resp_bt, working_days, launch_date, presentation_date, creative_status,
  status_btlive, status_migrante, brief_link, decks_link, created_at, updated_at
)
SELECT
  id, account_id, 'ua_traffic', project_name, team_notes,
  CASE
    WHEN creative_status IN ('Approved', 'Send') THEN 'COMPLETED'::task_status
    WHEN creative_status = 'In Progress' THEN 'IN_PROGRESS'::task_status
    ELSE 'PENDING'::task_status
  END,
  client_owner, area, tier, budget, brief_date, resp_bt,
  working_days, launch_date, presentation_date, creative_status,
  status_btlive, status_migrante, brief_link, decks_link, created_at, NOW()
FROM ua_traffic_projects
ON CONFLICT (id) DO NOTHING;

-- 3. Migrate UA tasks into tasks table
INSERT INTO tasks (
  id, title, description, project_id, assignee_id, status, priority,
  start_date, due_date, created_at, updated_at
)
SELECT
  id, title, description, project_id, assignee_id,
  status::task_status, priority::task_priority,
  start_date, due_date, created_at, updated_at
FROM ua_project_tasks
ON CONFLICT (id) DO NOTHING;

-- 4. Migrate UA comments into comments table
INSERT INTO comments (id, task_id, author_id, content, created_at)
SELECT id, task_id, author_id, content, created_at
FROM ua_task_comments
ON CONFLICT (id) DO NOTHING;

-- 5. Drop UA tables
DROP TABLE IF EXISTS ua_task_comments CASCADE;
DROP TABLE IF EXISTS ua_project_tasks CASCADE;
DROP TABLE IF EXISTS ua_traffic_projects CASCADE;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_account ON projects(account_id);
