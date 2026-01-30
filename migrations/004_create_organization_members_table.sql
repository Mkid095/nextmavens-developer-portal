-- Migration: Create organization_members table
-- Description: Create organization_members table to track team membership and roles
-- Version: 004

-- Create organization_members table
CREATE TABLE IF NOT EXISTS control_plane.organization_members (
    org_id UUID NOT NULL REFERENCES control_plane.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
    invited_by UUID REFERENCES developers(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);

-- Create index on user_id for querying memberships by user
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
ON control_plane.organization_members(user_id);

-- Create index on org_id for querying members by organization
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id
ON control_plane.organization_members(org_id);

-- Create index on role for filtering by role
CREATE INDEX IF NOT EXISTS idx_organization_members_role
ON control_plane.organization_members(role);

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('004', 'Create organization_members table', FALSE);
