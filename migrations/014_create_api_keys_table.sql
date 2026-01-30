-- Migration: Create api_keys table
-- Description: Create api_keys table with environment field for environment-aware key scoping
-- Version: 014
-- PRD: US-002 from prd-environment-parity.json

-- Create api_keys table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_type VARCHAR(20) NOT NULL CHECK (key_type IN ('public', 'secret', 'service_role', 'mcp')),
  key_prefix VARCHAR(20) NOT NULL,
  public_key VARCHAR(100) UNIQUE NOT NULL,
  secret_hash VARCHAR(255) NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  environment VARCHAR(20) NOT NULL DEFAULT 'prod' CHECK (environment IN ('prod', 'dev', 'staging')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rotated_to UUID REFERENCES control_plane.api_keys(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0
);

-- Create index on project_id for querying keys by project
CREATE INDEX IF NOT EXISTS idx_api_keys_project_id
ON control_plane.api_keys(project_id);

-- Create index on public_key for authentication lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_public_key
ON control_plane.api_keys(public_key);

-- Create index on environment for filtering by environment
CREATE INDEX IF NOT EXISTS idx_api_keys_environment
ON control_plane.api_keys(environment);

-- Create index on key_type for filtering by key type
CREATE INDEX IF NOT EXISTS idx_api_keys_key_type
ON control_plane.api_keys(key_type);

-- Create composite index for environment matching (key + project environment)
CREATE INDEX IF NOT EXISTS idx_api_keys_project_environment
ON control_plane.api_keys(project_id, environment);

-- Create unique constraint on project_id and name (each key name must be unique per project)
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_project_name_unique
ON control_plane.api_keys(project_id, name);

-- Add comments for documentation
COMMENT ON TABLE control_plane.api_keys IS 'API keys for authenticating requests to platform services, with environment scoping';

COMMENT ON COLUMN control_plane.api_keys.id IS 'Unique identifier for the API key';

COMMENT ON COLUMN control_plane.api_keys.project_id IS 'Reference to the project this key belongs to';

COMMENT ON COLUMN control_plane.api_keys.name IS 'Human-readable name for the key';

COMMENT ON COLUMN control_plane.api_keys.key_type IS 'Type of key: public, secret, service_role, mcp';

COMMENT ON COLUMN control_plane.api_keys.key_prefix IS 'Key prefix for identification (e.g., pk_prod_, sk_prod_)';

COMMENT ON COLUMN control_plane.api_keys.public_key IS 'Public key identifier (safe to expose)';

COMMENT ON COLUMN control_plane.api_keys.secret_hash IS 'Hashed secret value (never exposed)';

COMMENT ON COLUMN control_plane.api_keys.scopes IS 'JSONB array of permission scopes';

COMMENT ON COLUMN control_plane.api_keys.environment IS 'Environment this key is valid for: prod, dev, staging';

COMMENT ON COLUMN control_plane.api_keys.created_at IS 'When the key was created';

COMMENT ON COLUMN control_plane.api_keys.last_used IS 'Last time this key was used';

COMMENT ON COLUMN control_plane.api_keys.expires_at IS 'Optional expiration date for the key';

COMMENT ON COLUMN control_plane.api_keys.rotated_to IS 'If set, points to the new key after rotation';

COMMENT ON COLUMN control_plane.api_keys.usage_count IS 'Number of times this key has been used';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('014', 'Create api_keys table with environment field for environment-aware key scoping', FALSE);
