-- Migration: Create event_log table
-- Description: Track webhook delivery attempts and status
-- Version: 010
-- PRD: US-002 from prd-webhooks-events.json

-- Create event_log table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  webhook_id UUID REFERENCES control_plane.webhooks(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  response_code INTEGER,
  response_body TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create constraint to ensure only valid status values
ALTER TABLE control_plane.event_log
DROP CONSTRAINT IF EXISTS check_event_log_status;

ALTER TABLE control_plane.event_log
ADD CONSTRAINT check_event_log_status
CHECK (status IN ('pending', 'delivered', 'failed'));

-- Create composite index on project_id and status for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_log_project_id_status
ON control_plane.event_log(project_id, status);

-- Create index on project_id for filtering
CREATE INDEX IF NOT EXISTS idx_event_log_project_id
ON control_plane.event_log(project_id);

-- Create index on event_type for filtering by event type
CREATE INDEX IF NOT EXISTS idx_event_log_event_type
ON control_plane.event_log(event_type);

-- Create index on status for filtering by delivery status
CREATE INDEX IF NOT EXISTS idx_event_log_status
ON control_plane.event_log(status);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_event_log_created_at
ON control_plane.event_log(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE control_plane.event_log IS 'Track webhook delivery attempts and status';

COMMENT ON COLUMN control_plane.event_log.id IS 'Unique event log entry identifier';

COMMENT ON COLUMN control_plane.event_log.project_id IS 'Reference to the project that generated this event';

COMMENT ON COLUMN control_plane.event_log.event_type IS 'Type of event that occurred (e.g., project.created, user.signedup, file.uploaded)';

COMMENT ON COLUMN control_plane.event_log.payload IS 'Event payload data (JSONB format)';

COMMENT ON COLUMN control_plane.event_log.delivered_at IS 'Timestamp when the webhook was successfully delivered (null if pending/failed)';

COMMENT ON COLUMN control_plane.event_log.status IS 'Delivery status: pending, delivered, failed';

COMMENT ON COLUMN control_plane.event_log.created_at IS 'When this event log entry was created';

COMMENT ON COLUMN control_plane.event_log.webhook_id IS 'Reference to the webhook that delivered this event (null if event hasn\'t been delivered yet)';

COMMENT ON COLUMN control_plane.event_log.response_code IS 'HTTP response code from webhook delivery (null if pending)';

COMMENT ON COLUMN control_plane.event_log.response_body IS 'HTTP response body from webhook delivery (null if pending)';

COMMENT ON COLUMN control_plane.event_log.retry_count IS 'Number of delivery retry attempts (0 for first attempt)';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('010', 'Create event_log table for tracking webhook delivery', FALSE);
