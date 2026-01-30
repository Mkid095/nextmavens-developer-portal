-- Migration: Create audit_logs table
-- Description: Track all administrative and security-sensitive operations for audit compliance
-- Version: 016
-- Breaking: false
-- Rollback: DROP TABLE IF EXISTS control_plane.audit_logs CASCADE;

-- Create audit_logs table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('user', 'system', 'api_key', 'project')),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on actor_id for querying by actor
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
ON control_plane.audit_logs(actor_id);

-- Create index on actor_type for filtering by actor type
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_type
ON control_plane.audit_logs(actor_type);

-- Create index on action for filtering by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON control_plane.audit_logs(action);

-- Create index on target_type for filtering by target type
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type
ON control_plane.audit_logs(target_type);

-- Create index on target_id for querying by target
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id
ON control_plane.audit_logs(target_id);

-- Create index on project_id for filtering by project
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id
ON control_plane.audit_logs(project_id);

-- Create index on request_id for tracing requests
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id
ON control_plane.audit_logs(request_id);

-- Create index on created_at for time range queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON control_plane.audit_logs(created_at DESC);

-- Create composite index on (project_id, created_at) for efficient project audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_created
ON control_plane.audit_logs(project_id, created_at DESC);

-- Create composite index on (actor_id, created_at) for efficient actor audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
ON control_plane.audit_logs(actor_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE control_plane.audit_logs IS 'Track all administrative and security-sensitive operations for audit compliance';

COMMENT ON COLUMN control_plane.audit_logs.id IS 'Unique audit log entry identifier';
COMMENT ON COLUMN control_plane.audit_logs.actor_id IS 'ID of the entity that performed the action';
COMMENT ON COLUMN control_plane.audit_logs.actor_type IS 'Type of actor: user, system, api_key, or project';
COMMENT ON COLUMN control_plane.audit_logs.action IS 'Action performed (e.g., project.created, key.rotated, user.suspended)';
COMMENT ON COLUMN control_plane.audit_logs.target_type IS 'Type of target entity (e.g., project, api_key, user, secret)';
COMMENT ON COLUMN control_plane.audit_logs.target_id IS 'ID of the target entity';
COMMENT ON COLUMN control_plane.audit_logs.metadata IS 'Additional context about the action (JSONB)';
COMMENT ON COLUMN control_plane.audit_logs.ip_address IS 'Client IP address that performed the action';
COMMENT ON COLUMN control_plane.audit_logs.user_agent IS 'Client user agent string';
COMMENT ON COLUMN control_plane.audit_logs.request_id IS 'Correlation ID for request tracing';
COMMENT ON COLUMN control_plane.audit_logs.project_id IS 'Optional project ID for project-scoped audit filtering';
COMMENT ON COLUMN control_plane.audit_logs.created_at IS 'When the audit log entry was created';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('016', 'Create audit_logs table for tracking security operations', FALSE);
