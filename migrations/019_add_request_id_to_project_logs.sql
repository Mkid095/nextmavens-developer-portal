-- Migration: Add request_id column to project_logs for correlation tracking
-- Description: Enables distributed tracing by linking log entries to specific requests
-- Version: 019
-- Breaking: false
-- Rollback: ALTER TABLE control_plane.project_logs DROP COLUMN IF EXISTS request_id CASCADE;

-- Add request_id column to project_logs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'control_plane'
    AND table_name = 'project_logs'
    AND column_name = 'request_id'
  ) THEN
    ALTER TABLE control_plane.project_logs
    ADD COLUMN request_id VARCHAR(255);

    -- Add comment for documentation
    COMMENT ON COLUMN control_plane.project_logs.request_id IS 'Request identifier for distributed tracing (correlation ID from x-request-id header)';

    -- Create index on request_id for efficient querying
    CREATE INDEX idx_project_logs_request_id
      ON control_plane.project_logs(request_id);

    RAISE NOTICE 'Added request_id column to project_logs table';
  ELSE
    RAISE NOTICE 'request_id column already exists in project_logs table';
  END IF;
END $$;

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('019', 'Add request_id column to project_logs for correlation tracking', FALSE)
ON CONFLICT (version) DO NOTHING;
