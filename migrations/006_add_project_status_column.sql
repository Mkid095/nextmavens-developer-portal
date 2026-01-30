-- Migration: Add status column to projects table
-- Description: Add project lifecycle status (created, active, suspended, archived, deleted)
-- Version: 006
-- PRD: US-001 from prd-project-lifecycle.json

-- Add status column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'created' NOT NULL;

-- Create constraint to ensure only valid status values
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS check_project_status;

ALTER TABLE projects
ADD CONSTRAINT check_project_status
CHECK (status IN ('created', 'active', 'suspended', 'archived', 'deleted'));

-- Update existing projects to 'active' status
UPDATE projects
SET status = 'active'
WHERE status = 'created';

-- Create index on status for efficient querying
CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects(status);

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('006', 'Add status column to projects table', FALSE);
