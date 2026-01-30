-- Migration: Create quotas table
-- Description: Define monthly resource allowances per project (quotas vs hard caps)
-- Version: 009
-- PRD: US-001 from prd-quotas-limits.json

-- Create quotas table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.quotas (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  monthly_limit INTEGER NOT NULL DEFAULT 0,
  hard_cap INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, service)
);

-- Create constraint to ensure only valid services
ALTER TABLE control_plane.quotas
DROP CONSTRAINT IF EXISTS check_quotas_service;

ALTER TABLE control_plane.quotas
ADD CONSTRAINT check_quotas_service
CHECK (service IN ('db_queries', 'storage_mb', 'realtime_connections', 'function_invocations', 'auth_users'));

-- Create index on project_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_quotas_project_id
ON control_plane.quotas(project_id);

-- Create index on service for filtering
CREATE INDEX IF NOT EXISTS idx_quotas_service
ON control_plane.quotas(service);

-- Create index on reset_at for quota reset queries
CREATE INDEX IF NOT EXISTS idx_quotas_reset_at
ON control_plane.quotas(reset_at);

-- Add comments for documentation
COMMENT ON TABLE control_plane.quotas IS 'Monthly resource allowances per project (quotas vs hard caps)';

COMMENT ON COLUMN control_plane.quotas.project_id IS 'Reference to the project';

COMMENT ON COLUMN control_plane.quotas.service IS 'Service type: db_queries, storage_mb, realtime_connections, function_invocations, auth_users';

COMMENT ON COLUMN control_plane.quotas.monthly_limit IS 'Monthly resource allowance (business logic limit)';

COMMENT ON COLUMN control_plane.quotas.hard_cap IS 'Hard cap for abuse prevention (exceeding this triggers auto-suspend)';

COMMENT ON COLUMN control_plane.quotas.reset_at IS 'When the quota resets (typically monthly)';

COMMENT ON COLUMN control_plane.quotas.created_at IS 'When this quota record was created';

COMMENT ON COLUMN control_plane.quotas.updated_at IS 'When this quota record was last updated';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('009', 'Create quotas table for monthly resource allowances per project', FALSE);
