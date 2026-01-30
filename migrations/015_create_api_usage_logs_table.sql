-- Migration: Create api_usage_logs table
-- Description: Track individual API key usage requests for detailed usage statistics and analytics
-- Version: 015
-- PRD: US-009 from prd-enhanced-api-keys.json

-- Create api_usage_logs table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES control_plane.api_keys(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create composite index on (key_id, occurred_at) for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key_occurred
ON control_plane.api_usage_logs(key_id, occurred_at DESC);

-- Create index on project_id for project-level aggregation
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_project_id
ON control_plane.api_usage_logs(project_id);

-- Create index on occurred_at for time-based cleanup queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_occurred_at
ON control_plane.api_usage_logs(occurred_at DESC);

-- Create partial index for successful requests (2xx status codes)
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key_success
ON control_plane.api_usage_logs(key_id, occurred_at DESC)
WHERE status_code BETWEEN 200 AND 299;

-- Create partial index for error requests (4xx, 5xx status codes)
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key_error
ON control_plane.api_usage_logs(key_id, occurred_at DESC)
WHERE status_code >= 400;

-- Add comments for documentation
COMMENT ON TABLE control_plane.api_usage_logs IS 'Track individual API key usage requests for detailed usage statistics and analytics';

COMMENT ON COLUMN control_plane.api_usage_logs.id IS 'Unique identifier for the usage log entry';

COMMENT ON COLUMN control_plane.api_usage_logs.key_id IS 'Reference to the API key used for the request';

COMMENT ON COLUMN control_plane.api_usage_logs.project_id IS 'Reference to the project making the request';

COMMENT ON COLUMN control_plane.api_usage_logs.endpoint IS 'API endpoint that was called';

COMMENT ON COLUMN control_plane.api_usage_logs.method IS 'HTTP method (GET, POST, PUT, DELETE, etc.)';

COMMENT ON COLUMN control_plane.api_usage_logs.status_code IS 'HTTP status code returned (e.g., 200, 404, 500)';

COMMENT ON COLUMN control_plane.api_usage_logs.response_time_ms IS 'Response time in milliseconds (optional)';

COMMENT ON COLUMN control_plane.api_usage_logs.occurred_at IS 'When the API request occurred';

COMMENT ON COLUMN control_plane.api_usage_logs.created_at IS 'When this log entry was created';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('015', 'Create api_usage_logs table for tracking individual API key usage requests', FALSE);
