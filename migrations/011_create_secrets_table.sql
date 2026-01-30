-- Migration: Create secrets table
-- Description: Store encrypted secrets with versioning for rotation tracking
-- Version: 011
-- PRD: US-001 from prd-secrets-versioning.json

-- Create secrets table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value_encrypted TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  rotated_from UUID REFERENCES control_plane.secrets(id) ON DELETE SET NULL,
  rotation_reason VARCHAR(500),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint on (project_id, name, version)
-- Ensures each secret has unique version per project
ALTER TABLE control_plane.secrets
DROP CONSTRAINT IF EXISTS secrets_project_name_version_unique;

ALTER TABLE control_plane.secrets
ADD CONSTRAINT secrets_project_name_version_unique
UNIQUE (project_id, name, version);

-- Create index on (project_id, name) for lookup
CREATE INDEX IF NOT EXISTS idx_secrets_project_id_name
ON control_plane.secrets(project_id, name);

-- Create index on active for finding current version
CREATE INDEX IF NOT EXISTS idx_secrets_active
ON control_plane.secrets(active) WHERE active = TRUE;

-- Create index on rotated_from for tracking rotation chain
CREATE INDEX IF NOT EXISTS idx_secrets_rotated_from
ON control_plane.secrets(rotated_from) WHERE rotated_from IS NOT NULL;

-- Record migration in schema_migrations
INSERT INTO control_plane.schema_migrations (version, description, applied_at)
VALUES (
  '011',
  'Create secrets table with versioning',
  NOW()
)
ON CONFLICT (version) DO NOTHING;
