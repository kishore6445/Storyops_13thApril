-- Create monthly_content_plans table
CREATE TABLE IF NOT EXISTS public.monthly_content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  planning_month VARCHAR(20) NOT NULL,
  planning_year INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(client_id, planning_month, planning_year)
);

-- Create monthly_content_plan_items table (line items for each platform-content_type combo)
CREATE TABLE IF NOT EXISTS public.monthly_content_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.monthly_content_plans(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_content_plans_client_id
  ON public.monthly_content_plans(client_id);

CREATE INDEX IF NOT EXISTS idx_monthly_content_plans_created_by
  ON public.monthly_content_plans(created_by);

CREATE INDEX IF NOT EXISTS idx_monthly_content_plans_month_year
  ON public.monthly_content_plans(planning_month, planning_year);

CREATE INDEX IF NOT EXISTS idx_monthly_content_plan_items_plan_id
  ON public.monthly_content_plan_items(plan_id);

CREATE INDEX IF NOT EXISTS idx_monthly_content_plan_items_platform
  ON public.monthly_content_plan_items(platform);

-- Enable Row Level Security
ALTER TABLE public.monthly_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_content_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_content_plans
CREATE POLICY "Users can view monthly content plans for their clients" ON public.monthly_content_plans
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create monthly content plans" ON public.monthly_content_plans
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own monthly content plans" ON public.monthly_content_plans
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own monthly content plans" ON public.monthly_content_plans
  FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for monthly_content_plan_items (inherit from plan)
CREATE POLICY "Users can view monthly content plan items" ON public.monthly_content_plan_items
  FOR SELECT
  USING (
    plan_id IN (
      SELECT id FROM public.monthly_content_plans 
      WHERE created_by = auth.uid()
        OR client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create monthly content plan items" ON public.monthly_content_plan_items
  FOR INSERT
  WITH CHECK (
    plan_id IN (
      SELECT id FROM public.monthly_content_plans 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update monthly content plan items" ON public.monthly_content_plan_items
  FOR UPDATE
  USING (
    plan_id IN (
      SELECT id FROM public.monthly_content_plans 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete monthly content plan items" ON public.monthly_content_plan_items
  FOR DELETE
  USING (
    plan_id IN (
      SELECT id FROM public.monthly_content_plans 
      WHERE created_by = auth.uid()
    )
  );

-- Create update trigger for monthly_content_plans
CREATE OR REPLACE FUNCTION update_monthly_content_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS monthly_content_plans_updated_at ON public.monthly_content_plans;

CREATE TRIGGER monthly_content_plans_updated_at
  BEFORE UPDATE ON public.monthly_content_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_content_plans_updated_at();

-- Create update trigger for monthly_content_plan_items
CREATE OR REPLACE FUNCTION update_monthly_content_plan_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS monthly_content_plan_items_updated_at ON public.monthly_content_plan_items;

CREATE TRIGGER monthly_content_plan_items_updated_at
  BEFORE UPDATE ON public.monthly_content_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_content_plan_items_updated_at();
