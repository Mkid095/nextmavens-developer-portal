-- Migration: Add expires_at column to secrets table
-- Description: Add grace period support for old secret versions
-- Version: 019
-- PRD: US-006 from prd-secrets-versioning.json

-- Add expires_at column to secrets table
-- This column tracks when a non-active secret version should be deleted
-- Active secrets have NULL expires_at (they don't expire)
-- Inactive secrets have expires_at set to NOW() + 24 hours from rotation
ALTER TABLE control_plane.secrets
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create index on expires_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_secrets_expires_at
ON control_plane.secrets(expires_at) WHERE expires_at IS NOT NULL;

-- Record migration in schema_migrations
INSERT INTO control_plane.schema_migrations (version, description, applied_at)
VALUES (
  '019',
  'Add expires_at column to secrets table for grace period support',
  NOW()
)
ON CONFLICT (version) DO NOTHING;
