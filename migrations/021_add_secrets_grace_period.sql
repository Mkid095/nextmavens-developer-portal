-- Migration: Add grace period columns to secrets table
-- This adds support for US-006: Grace Period for Old Secrets
-- When a secret is rotated, the old version remains decryptable for 24 hours
-- before being automatically deleted

-- Add grace_period_ends_at column to track when old versions should be deleted
ALTER TABLE control_plane.secrets
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- Add grace_period_warning_sent_at to track if warning was already sent
ALTER TABLE control_plane.secrets
ADD COLUMN IF NOT EXISTS grace_period_warning_sent_at TIMESTAMPTZ;

-- Add index on grace_period_ends_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_secrets_grace_period_ends_at
ON control_plane.secrets(grace_period_ends_at)
WHERE grace_period_ends_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN control_plane.secrets.grace_period_ends_at IS 'Timestamp when the grace period ends for this secret version. After this time, the old version can be deleted.';
COMMENT ON COLUMN control_plane.secrets.grace_period_warning_sent_at IS 'Timestamp when the expiration warning was sent for this secret version. Used to avoid duplicate warnings.';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, applied_at)
VALUES (21, 'add_secrets_grace_period', NOW())
ON CONFLICT (version) DO NOTHING;
