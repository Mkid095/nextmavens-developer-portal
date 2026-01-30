-- Migration: Add organization invitations
-- Description: Add email, status, and invitation_token columns to organization_members for pending invitations
-- Version: 017

-- Add email column for invitations by email (user_id can be NULL for pending invitations)
ALTER TABLE control_plane.organization_members
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add status column to track invitation state (pending, accepted, declined)
ALTER TABLE control_plane.organization_members
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted'
CHECK (status IN ('pending', 'accepted', 'declined'));

-- Add invitation_token column for secure invitation links
ALTER TABLE control_plane.organization_members
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255) UNIQUE;

-- Add token_expires_at column for invitation expiry
ALTER TABLE control_plane.organization_members
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Make user_id nullable to allow pending invitations (email-only invites)
ALTER TABLE control_plane.organization_members
ALTER COLUMN user_id DROP NOT NULL;

-- Update primary key constraint to be a unique index instead (to allow NULL user_id for pending invites)
-- First, drop the existing primary key
ALTER TABLE control_plane.organization_members
DROP CONSTRAINT IF EXISTS organization_members_pkey;

-- Add a unique constraint on org_id and user_id where user_id is not NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_members_org_user
ON control_plane.organization_members(org_id, user_id)
WHERE user_id IS NOT NULL;

-- Add a unique constraint on org_id and email for pending invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_members_org_email
ON control_plane.organization_members(org_id, email)
WHERE email IS NOT NULL;

-- Create a surrogate primary key
ALTER TABLE control_plane.organization_members
ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;

-- Add index on invitation_token for lookup
CREATE INDEX IF NOT EXISTS idx_organization_members_invitation_token
ON control_plane.organization_members(invitation_token)
WHERE invitation_token IS NOT NULL;

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_organization_members_status
ON control_plane.organization_members(status);

-- Set default status to 'accepted' for existing records
UPDATE control_plane.organization_members
SET status = 'accepted'
WHERE status IS NULL;

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('017', 'Add organization invitations (email, status, invitation_token)', FALSE);
