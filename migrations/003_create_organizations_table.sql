-- Migration: Create organizations table
-- Description: Create organizations table to support multi-tenant team structures
-- Version: 003

-- Create organizations table
CREATE TABLE IF NOT EXISTS control_plane.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on owner_id for querying organizations by owner
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id
ON control_plane.organizations(owner_id);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug
ON control_plane.organizations(slug);

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('003', 'Create organizations table', FALSE);
