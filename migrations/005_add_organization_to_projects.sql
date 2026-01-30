-- Migration: Add organization_id to projects table
-- Description: Add organization_id foreign key to projects table to support team collaboration
-- Version: 005

-- Add organization_id column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES control_plane.organizations(id) ON DELETE SET NULL;

-- Create index on organization_id for efficient querying
CREATE INDEX IF NOT EXISTS idx_projects_organization_id
ON projects(organization_id);

-- Create index for filtering projects by organization membership
-- This helps query: "all projects visible to org members"
CREATE INDEX IF NOT EXISTS idx_projects_org_visibility
ON projects(organization_id, developer_id);

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('005', 'Add organization_id to projects table', FALSE);
