-- Create report_shares table for shareable report links
CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  created_by UUID NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  client_id UUID,        -- NULL means all clients
  user_id UUID,          -- NULL means all users (team-wide)
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_report_shares_token ON report_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_report_shares_created_by ON report_shares(created_by);
