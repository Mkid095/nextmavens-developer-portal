-- Migration: Create provisioning_steps table
-- Description: Track each provisioning step separately with status, timestamps, and error details
-- Version: 007
-- PRD: US-001 from prd-provisioning-state-machine.json

-- Create provisioning_steps table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.provisioning_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create constraint to ensure only valid status values
ALTER TABLE control_plane.provisioning_steps
DROP CONSTRAINT IF EXISTS check_provisioning_step_status;

ALTER TABLE control_plane.provisioning_steps
ADD CONSTRAINT check_provisioning_step_status
CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped'));

-- Add unique constraint on (project_id, step_name)
ALTER TABLE control_plane.provisioning_steps
DROP CONSTRAINT IF EXISTS provisioning_steps_project_id_step_name_unique;

ALTER TABLE control_plane.provisioning_steps
ADD CONSTRAINT provisioning_steps_project_id_step_name_unique
UNIQUE (project_id, step_name);

-- Create index on project_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_provisioning_steps_project_id
ON control_plane.provisioning_steps(project_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_provisioning_steps_status
ON control_plane.provisioning_steps(status);

-- Create composite index on project_id and status for common queries
CREATE INDEX IF NOT EXISTS idx_provisioning_steps_project_id_status
ON control_plane.provisioning_steps(project_id, status);

-- Add comments for documentation
COMMENT ON TABLE control_plane.provisioning_steps IS 'Track each provisioning step separately with status and error details';

COMMENT ON COLUMN control_plane.provisioning_steps.id IS 'Unique provisioning step identifier';

COMMENT ON COLUMN control_plane.provisioning_steps.project_id IS 'Reference to the project being provisioned';

COMMENT ON COLUMN control_plane.provisioning_steps.step_name IS 'Name of the provisioning step (e.g., create_database, setup_auth)';

COMMENT ON COLUMN control_plane.provisioning_steps.status IS 'Current status: pending, running, success, failed, skipped';

COMMENT ON COLUMN control_plane.provisioning_steps.started_at IS 'When the step started execution';

COMMENT ON COLUMN control_plane.provisioning_steps.completed_at IS 'When the step completed (success or failure)';

COMMENT ON COLUMN control_plane.provisioning_steps.error_message IS 'Human-readable error message if step failed';

COMMENT ON COLUMN control_plane.provisioning_steps.error_details IS 'Detailed error information as JSONB (error_type, stack_trace, context)';

COMMENT ON COLUMN control_plane.provisioning_steps.retry_count IS 'Number of times this step has been retried';

COMMENT ON COLUMN control_plane.provisioning_steps.created_at IS 'When this provisioning step record was created';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('007', 'Create provisioning_steps table for tracking provisioning state machine', FALSE);
