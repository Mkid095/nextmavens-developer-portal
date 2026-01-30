-- Migration: Add deleted_at column to secrets table
-- PRD: US-008 from prd-secrets-versioning.json
-- Description: Soft delete support for secrets. Sets deleted_at timestamp when secret is deleted.
-- Hard delete after 30 days via background job.

-- Add deleted_at column to secrets table
ALTER TABLE control_plane.secrets
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index on deleted_at for efficient soft delete queries
CREATE INDEX IF NOT EXISTS idx_secrets_deleted_at
ON control_plane.secrets(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Add comment to document the soft delete behavior
COMMENT ON COLUMN control_plane.secrets.deleted_at IS 'Soft delete timestamp. Set when secret is deleted. Hard delete occurs 30 days after this timestamp.';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, applied_at)
VALUES ('023', 'Add deleted_at column to secrets for soft delete', NOW())
ON CONFLICT (version) DO NOTHING;
