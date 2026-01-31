-- Migration 025: Add admin_notes column to support_requests table
-- US-010: Create Admin Support UI - Allows admins to add notes to support requests

-- Add admin_notes column to support_requests
ALTER TABLE control_plane.support_requests
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add comment
COMMENT ON COLUMN control_plane.support_requests.admin_notes IS 'Internal notes added by administrators when managing support requests';
