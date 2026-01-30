-- Migration: Create webhooks table
-- Description: Store webhook configurations for event delivery to external systems
-- Version: 009
-- PRD: US-001 from prd-webhooks-events.json

-- Create webhooks table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  target_url VARCHAR(2048) NOT NULL,
  secret VARCHAR(255) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  enabled BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on project_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_webhooks_project_id
ON control_plane.webhooks(project_id);

-- Create index on event for filtering by event type
CREATE INDEX IF NOT EXISTS idx_webhooks_event
ON control_plane.webhooks(event);

-- Create composite index on project_id and event for common queries
CREATE INDEX IF NOT EXISTS idx_webhooks_project_id_event
ON control_plane.webhooks(project_id, event);

-- Add comments for documentation
COMMENT ON TABLE control_plane.webhooks IS 'Store webhook configurations for event delivery to external systems';

COMMENT ON COLUMN control_plane.webhooks.id IS 'Unique webhook identifier';

COMMENT ON COLUMN control_plane.webhooks.project_id IS 'Reference to the project that owns this webhook';

COMMENT ON COLUMN control_plane.webhooks.event IS 'Event type that triggers this webhook (e.g., project.created, user.signedup, file.uploaded)';

COMMENT ON COLUMN control_plane.webhooks.target_url IS 'URL endpoint where webhook events will be delivered';

COMMENT ON COLUMN control_plane.webhooks.secret IS 'Secret key for HMAC-SHA256 signature verification (auto-generated on creation)';

COMMENT ON COLUMN control_plane.webhooks.enabled IS 'Whether this webhook is active and should receive events';

COMMENT ON COLUMN control_plane.webhooks.created_at IS 'When this webhook configuration was created';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('009', 'Create webhooks table for event delivery to external systems', FALSE);
