-- Add production lifecycle columns to content_records
ALTER TABLE public.content_records
  ADD COLUMN IF NOT EXISTS production_started DATE,
  ADD COLUMN IF NOT EXISTS production_completed DATE;