-- Expand content_records status check constraint to include in_production and production_done
ALTER TABLE public.content_records
  DROP CONSTRAINT IF EXISTS content_records_status_check;

ALTER TABLE public.content_records
  ADD CONSTRAINT content_records_status_check
  CHECK (status IN ('planned', 'in_production', 'production_done', 'scheduled', 'published', 'pending', 'missed', 'paused'));
