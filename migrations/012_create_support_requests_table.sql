-- Migration: Create support_requests table
-- Description: Track support tickets per project with status and context
-- Version: 012
-- PRD: US-001 from prd-support-escape-hatch.json

-- Create support_requests table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  context JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create constraint to ensure only valid statuses
ALTER TABLE control_plane.support_requests
DROP CONSTRAINT IF EXISTS check_support_requests_status;

ALTER TABLE control_plane.support_requests
ADD CONSTRAINT check_support_requests_status
CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));

-- Create index on project_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_support_requests_project_id
ON control_plane.support_requests(project_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_support_requests_status
ON control_plane.support_requests(status);

-- Create composite index on project_id and status for common queries
CREATE INDEX IF NOT EXISTS idx_support_requests_project_id_status
ON control_plane.support_requests(project_id, status);

-- Create index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id
ON control_plane.support_requests(user_id);

-- Add comments for documentation
COMMENT ON TABLE control_plane.support_requests IS 'Support tickets per project with status and context';

COMMENT ON COLUMN control_plane.support_requests.id IS 'Unique identifier for the support request';

COMMENT ON COLUMN control_plane.support_requests.project_id IS 'Reference to the project';

COMMENT ON COLUMN control_plane.support_requests.user_id IS 'User who created the support request';

COMMENT ON COLUMN control_plane.support_requests.subject IS 'Subject/title of the support request';

COMMENT ON COLUMN control_plane.support_requests.description IS 'Detailed description of the issue';

COMMENT ON COLUMN control_plane.support_requests.context IS 'Additional context (JSONB): project info, errors, logs, usage metrics';

COMMENT ON COLUMN control_plane.support_requests.status IS 'Current status: open, in_progress, resolved, closed';

COMMENT ON COLUMN control_plane.support_requests.created_at IS 'When the support request was created';

COMMENT ON COLUMN control_plane.support_requests.resolved_at IS 'When the support request was resolved (null if not resolved)';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('012', 'Create support_requests table for tracking support tickets', FALSE);
