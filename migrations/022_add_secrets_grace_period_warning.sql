-- Migration: Add grace_period_warning_sent_at column to secrets table
-- This adds support for US-006: Grace Period for Old Secrets - Warning notification
-- Tracks when the expiration warning was sent for old secret versions

-- Add grace_period_warning_sent_at column to track if warning was already sent
ALTER TABLE control_plane.secrets
ADD COLUMN IF NOT EXISTS grace_period_warning_sent_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN control_plane.secrets.grace_period_warning_sent_at IS 'Timestamp when the expiration warning was sent for this secret version. Used to avoid duplicate warnings.';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, applied_at)
VALUES (22, 'add_secrets_grace_period_warning', NOW())
ON CONFLICT (version) DO NOTHING;
