-- Add archival support to sprint_tasks table
-- Soft-delete approach: tasks marked as archived but not deleted from database

ALTER TABLE public.sprint_tasks
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS archived_by UUID DEFAULT NULL;

-- Create index for efficient archive queries
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_archived_at ON public.sprint_tasks(archived_at);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_archived_by ON public.sprint_tasks(archived_by);

-- Create composite index for filtering active vs archived tasks
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_active ON public.sprint_tasks(client_id, status)
  WHERE archived_at IS NULL;

-- Create composite index for archive queries
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_archived ON public.sprint_tasks(client_id, archived_at)
  WHERE archived_at IS NOT NULL;

-- Add foreign key constraint for archived_by
ALTER TABLE public.sprint_tasks
  ADD CONSTRAINT fk_sprint_tasks_archived_by
  FOREIGN KEY (archived_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;
