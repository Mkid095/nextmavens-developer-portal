-- Migration: 021_add_suspension_type_column.sql
-- Description: Add suspension_type column to suspensions table to track manual vs automatic suspensions
-- PRD: US-010 - Implement Auto-Status Transitions
--
-- This migration adds a suspension_type column to distinguish between:
-- - 'manual': Suspended by a platform operator via API
-- - 'automatic': Suspended by the background job for exceeding hard caps
--
-- This allows the quota reset job to auto-resume only manually suspended projects.

-- Add suspension_type column with default 'manual'
ALTER TABLE control_plane.suspensions
ADD COLUMN IF NOT EXISTS suspension_type VARCHAR(20) DEFAULT 'manual' NOT NULL;

-- Add check constraint to ensure only valid values
ALTER TABLE control_plane.suspensions
ADD CONSTRAINT check_suspension_type
CHECK (suspension_type IN ('manual', 'automatic'));

-- Add index for faster queries on suspension type
CREATE INDEX IF NOT EXISTS idx_suspensions_type
ON control_plane.suspensions(suspension_type)
WHERE resolved_at IS NULL;

-- Update existing suspensions to 'manual' by default (they were all manual before this change)
UPDATE control_plane.suspensions
SET suspension_type = 'manual'
WHERE suspension_type IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN control_plane.suspensions.suspension_type IS 'Type of suspension: "manual" (by operator) or "automatic" (by system for quota violations)';
