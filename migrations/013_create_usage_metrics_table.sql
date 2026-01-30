-- Migration: Create usage_metrics table
-- Description: Track resource consumption metrics per project for billing and quotas enforcement
-- Version: 013
-- PRD: US-001 from prd-usage-tracking.json

-- Create usage_metrics table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  quantity BIGINT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create constraint to ensure only valid metric types
ALTER TABLE control_plane.usage_metrics
DROP CONSTRAINT IF EXISTS check_usage_metrics_metric_type;

ALTER TABLE control_plane.usage_metrics
ADD CONSTRAINT check_usage_metrics_metric_type
CHECK (metric_type IN (
  'db_query',
  'db_row_read',
  'db_row_written',
  'realtime_message',
  'realtime_connection',
  'storage_upload',
  'storage_download',
  'storage_bytes',
  'auth_signup',
  'auth_signin',
  'function_invocation'
));

-- Create constraint to ensure only valid services
ALTER TABLE control_plane.usage_metrics
DROP CONSTRAINT IF EXISTS check_usage_metrics_service;

ALTER TABLE control_plane.usage_metrics
ADD CONSTRAINT check_usage_metrics_service
CHECK (service IN ('database', 'realtime', 'storage', 'auth', 'functions'));

-- Create composite index on (project_id, service, recorded_at) for efficient aggregation queries
CREATE INDEX IF NOT EXISTS idx_usage_metrics_project_service_recorded
ON control_plane.usage_metrics(project_id, service, recorded_at DESC);

-- Create index on project_id for quick project-specific queries
CREATE INDEX IF NOT EXISTS idx_usage_metrics_project_id
ON control_plane.usage_metrics(project_id);

-- Create index on metric_type for filtering by metric type
CREATE INDEX IF NOT EXISTS idx_usage_metrics_metric_type
ON control_plane.usage_metrics(metric_type);

-- Create index on recorded_at for date range queries
CREATE INDEX IF NOT EXISTS idx_usage_metrics_recorded_at
ON control_plane.usage_metrics(recorded_at DESC);

-- Add comments for documentation
COMMENT ON TABLE control_plane.usage_metrics IS 'Track resource consumption metrics per project for billing and quotas enforcement';

COMMENT ON COLUMN control_plane.usage_metrics.id IS 'Unique identifier for the metric record';

COMMENT ON COLUMN control_plane.usage_metrics.project_id IS 'Reference to the project consuming resources';

COMMENT ON COLUMN control_plane.usage_metrics.service IS 'Service type: database, realtime, storage, auth, functions';

COMMENT ON COLUMN control_plane.usage_metrics.metric_type IS 'Specific metric being tracked: db_query, db_row_read, db_row_written, realtime_message, realtime_connection, storage_upload, storage_download, storage_bytes, auth_signup, auth_signin, function_invocation';

COMMENT ON COLUMN control_plane.usage_metrics.quantity IS 'Amount of resource consumed (count for queries/connections, bytes for storage)';

COMMENT ON COLUMN control_plane.usage_metrics.recorded_at IS 'When the metric was recorded (for aggregation)';

COMMENT ON COLUMN control_plane.usage_metrics.created_at IS 'When this record was created in the database';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('013', 'Create usage_metrics table for tracking resource consumption per project', FALSE);
