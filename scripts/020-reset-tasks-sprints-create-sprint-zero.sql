-- ============================================================================
-- RESET SCRIPT: Archive and Clear All Tasks & Sprints
-- ============================================================================
-- This script:
-- 1. Creates backup/archive tables for tasks, sprints, and time entries
-- 2. Copies all current data to archives
-- 3. Deletes all tasks, sprints, and time entries from main tables
-- 4. Preserves all users and clients (NOT deleted)
-- ============================================================================

-- Step 1: Create backup tables to archive old data
-- ============================================================================

-- Archive for sprints
CREATE TABLE IF NOT EXISTS sprints_archive (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archive for sprint_tasks
CREATE TABLE IF NOT EXISTS sprint_tasks_archive (
  id UUID PRIMARY KEY,
  sprint_id UUID,
  client_id UUID NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL,
  priority VARCHAR(50),
  assigned_to UUID,
  due_date DATE,
  phase VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archive for tasks (from phase sections)
CREATE TABLE IF NOT EXISTS tasks_archive (
  id UUID PRIMARY KEY,
  section_id UUID,
  client_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  status TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archive for time_entries
CREATE TABLE IF NOT EXISTS time_entries_archive (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL,
  client_id UUID,
  sprint_id UUID,
  task_id UUID,
  hours DECIMAL(4, 2),
  work_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Copy all current data to archive tables
-- ============================================================================

INSERT INTO sprints_archive (id, client_id, name, start_date, end_date, status, created_at, updated_at)
SELECT id, client_id, name, start_date, end_date, status, created_at, updated_at
FROM sprints
ON CONFLICT DO NOTHING;

INSERT INTO sprint_tasks_archive (id, sprint_id, client_id, title, description, status, priority, assigned_to, due_date, phase, created_at, updated_at)
SELECT id, sprint_id, client_id, title, description, status, priority, assigned_to, due_date, phase, created_at, updated_at
FROM sprint_tasks
ON CONFLICT DO NOTHING;

INSERT INTO tasks_archive (id, section_id, client_id, title, description, assigned_to, status, due_date, created_at, updated_at)
SELECT id, section_id, client_id, title, description, assigned_to, status, due_date, created_at, updated_at
FROM tasks
ON CONFLICT DO NOTHING;

INSERT INTO time_entries_archive (id, report_id, client_id, sprint_id, task_id, hours, work_description, created_at, updated_at)
SELECT id, report_id, client_id, sprint_id, task_id, hours, work_description, created_at, updated_at
FROM time_entries
ON CONFLICT DO NOTHING;

-- Step 3: Delete all tasks from time_entries (cascades delete reports if empty)
-- ============================================================================

DELETE FROM time_entries;

-- Delete all time_entries orphaned reports (optional cleanup)
DELETE FROM daily_reports WHERE id NOT IN (SELECT DISTINCT report_id FROM time_entries);

-- Step 4: Delete all tasks and sprints
-- ============================================================================

-- Delete from tasks table (will cascade to task_subtasks if configured)
DELETE FROM tasks;

-- Delete from sprint_tasks table
DELETE FROM sprint_tasks;

-- Delete from individual_sprint_tasks (junction table)
DELETE FROM individual_sprint_tasks;

-- Delete from individual_sprints (personal sprints)
DELETE FROM individual_sprints;

-- Delete from sprints table
DELETE FROM sprints;

-- Step 5: Verify the reset
-- ============================================================================

-- Check counts
SELECT 
  (SELECT COUNT(*) FROM sprints) as total_sprints,
  (SELECT COUNT(*) FROM sprint_tasks) as total_sprint_tasks,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM time_entries) as total_time_entries,
  (SELECT COUNT(*) FROM daily_reports) as total_daily_reports,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM users) as total_users;

-- ============================================================================
-- RESET COMPLETE
-- ============================================================================
-- Summary:
-- ✓ All old sprints, sprint_tasks, and tasks moved to archive tables
-- ✓ All time_entries moved to archive (daily_reports cleaned)
-- ✓ All main tables cleared (clean slate)
-- ✓ Users and clients are UNTOUCHED
-- ✓ No sprints created (teams will auto-create via cron on Saturday)
--
-- Archive tables for reference/audit trail:
-- - sprints_archive
-- - sprint_tasks_archive
-- - tasks_archive
-- - time_entries_archive
-- ============================================================================
