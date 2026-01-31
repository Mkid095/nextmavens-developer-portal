-- Migration: Add previous_status column to support_requests table
-- Description: Track the previous status for support request status change notifications
-- Version: 024
-- PRD: US-009 from prd-support-escape-hatch.json

-- Add previous_status column to support_requests table
ALTER TABLE control_plane.support_requests
ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN control_plane.support_requests.previous_status IS 'Previous status before the last status change (used for notifications)';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('024', 'Add previous_status column to support_requests for status change notifications', FALSE);
