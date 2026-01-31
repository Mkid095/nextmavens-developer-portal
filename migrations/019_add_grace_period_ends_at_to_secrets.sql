-- Migration: Add grace_period_ends_at column to secrets table
-- Description: Add grace period support for old secret versions
-- Version: 019
-- PRD: US-006 from prd-secrets-versioning.json

-- Add grace_period_ends_at column to secrets table
-- This column tracks when a non-active secret version should be deleted
-- Active secrets have NULL grace_period_ends_at (they don't expire)
-- Inactive secrets have grace_period_ends_at set to NOW() + 24 hours from rotation
ALTER TABLE control_plane.secrets
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- Add grace_period_warning_sent_at column to track when expiration warning was sent
-- This prevents sending duplicate warnings for the same secret version
ALTER TABLE control_plane.secrets
ADD COLUMN IF NOT EXISTS grace_period_warning_sent_at TIMESTAMPTZ;

-- Create index on grace_period_ends_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_secrets_grace_period_ends_at
ON control_plane.secrets(grace_period_ends_at) WHERE grace_period_ends_at IS NOT NULL;

-- Create index on grace_period_warning_sent_at to track which warnings were sent
CREATE INDEX IF NOT EXISTS idx_secrets_grace_period_warning_sent_at
ON control_plane.secrets(grace_period_warning_sent_at) WHERE grace_period_warning_sent_at IS NOT NULL;

-- Record migration in schema_migrations
INSERT INTO control_plane.schema_migrations (version, description, applied_at)
VALUES (
  '019',
  'Add grace_period_ends_at column to secrets table for grace period support',
  NOW()
)
ON CONFLICT (version) DO NOTHING;
