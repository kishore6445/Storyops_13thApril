-- Migration 026: Create content_buckets table
-- Aggregated content tracking: one row per client + month + year + platform + content_type
-- This replaces per-post tracking for the Content Tracker view.

CREATE TABLE IF NOT EXISTS public.content_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  planning_month VARCHAR(20) NOT NULL,   -- e.g. "april"
  planning_year INT NOT NULL,             -- e.g. 2026
  platform VARCHAR(50) NOT NULL,          -- e.g. "Instagram"
  content_type VARCHAR(50) NOT NULL,      -- e.g. "Reel"
  owner_id UUID REFERENCES public.users(id),
  target INT NOT NULL DEFAULT 0,
  production_done INT NOT NULL DEFAULT 0,
  scheduled INT NOT NULL DEFAULT 0,
  published INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation: each stage cannot exceed prior stage
  CONSTRAINT production_done_lte_target CHECK (production_done <= target),
  CONSTRAINT scheduled_lte_production_done CHECK (scheduled <= production_done),
  CONSTRAINT published_lte_scheduled CHECK (published <= scheduled),

  UNIQUE(client_id, planning_month, planning_year, platform, content_type)
);

CREATE INDEX IF NOT EXISTS idx_content_buckets_client ON public.content_buckets(client_id);
CREATE INDEX IF NOT EXISTS idx_content_buckets_month_year ON public.content_buckets(planning_month, planning_year);
CREATE INDEX IF NOT EXISTS idx_content_buckets_platform ON public.content_buckets(platform);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_buckets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_buckets_updated_at ON public.content_buckets;
CREATE TRIGGER content_buckets_updated_at
  BEFORE UPDATE ON public.content_buckets
  FOR EACH ROW EXECUTE FUNCTION update_content_buckets_updated_at();
