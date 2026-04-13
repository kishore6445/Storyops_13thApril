-- Add completed_at support for sprint_tasks
ALTER TABLE public.sprint_tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sprint_tasks_completed_at ON public.sprint_tasks(completed_at);