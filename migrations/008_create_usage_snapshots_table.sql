-- Migration: Create usage_snapshots table
-- Description: Track actual resource consumption for quota enforcement
-- Version: 008
-- PRD: US-002 from prd-quotas-limits.json

-- Create usage_snapshots table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create constraint to ensure only valid metric types
ALTER TABLE control_plane.usage_snapshots
DROP CONSTRAINT IF EXISTS check_usage_metric_type;

ALTER TABLE control_plane.usage_snapshots
ADD CONSTRAINT check_usage_metric_type
CHECK (metric_type IN ('db_query', 'storage_upload', 'realtime_message', 'function_call', 'auth_signup'));

-- Create index on (project_id, service, recorded_at) for efficient aggregation
CREATE INDEX IF NOT EXISTS idx_usage_snapshots_project_service_recorded
ON control_plane.usage_snapshots(project_id, service, recorded_at DESC);

-- Create index on project_id for filtering
CREATE INDEX IF NOT EXISTS idx_usage_snapshots_project_id
ON control_plane.usage_snapshots(project_id);

-- Create index on service for filtering
CREATE INDEX IF NOT EXISTS idx_usage_snapshots_service
ON control_plane.usage_snapshots(service);

-- Create index on metric_type for filtering
CREATE INDEX IF NOT EXISTS idx_usage_snapshots_metric_type
ON control_plane.usage_snapshots(metric_type);

-- Create index on recorded_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_usage_snapshots_recorded_at
ON control_plane.usage_snapshots(recorded_at DESC);

-- Add comments for documentation
COMMENT ON TABLE control_plane.usage_snapshots IS 'Track actual resource consumption for quota enforcement';

COMMENT ON COLUMN control_plane.usage_snapshots.id IS 'Unique usage snapshot identifier';

COMMENT ON COLUMN control_plane.usage_snapshots.project_id IS 'Reference to the project consuming resources';

COMMENT ON COLUMN control_plane.usage_snapshots.service IS 'Service being consumed (e.g., database, storage, realtime, functions, auth)';

COMMENT ON COLUMN control_plane.usage_snapshots.metric_type IS 'Type of metric: db_query, storage_upload, realtime_message, function_call, auth_signup';

COMMENT ON COLUMN control_plane.usage_snapshots.amount IS 'Amount of resource consumed';

COMMENT ON COLUMN control_plane.usage_snapshots.recorded_at IS 'When the usage was recorded (for time-window aggregation)';

COMMENT ON COLUMN control_plane.usage_snapshots.created_at IS 'When this snapshot record was created';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('008', 'Create usage_snapshots table for tracking resource consumption', FALSE);
