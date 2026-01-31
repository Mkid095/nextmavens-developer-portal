-- Migration: Add query_timeout to projects table
-- Description: US-007 - Add configurable query timeout per project. Default 30 seconds.
-- Version: 026
-- Breaking: false
-- Rollback: ALTER TABLE control_plane.projects DROP COLUMN IF EXISTS query_timeout;

-- Add query_timeout column to projects table (in milliseconds)
-- Default: 30000 (30 seconds)
-- NULL: Falls back to default timeout
ALTER TABLE control_plane.projects
ADD COLUMN IF NOT EXISTS query_timeout INTEGER DEFAULT 30000 CHECK (query_timeout >= 1000 AND query_timeout <= 300000);

-- Add comment to document the column
COMMENT ON COLUMN control_plane.projects.query_timeout IS 'Query execution timeout in milliseconds for SQL queries. Default: 30000 (30 seconds). Min: 1000 (1 second), Max: 300000 (5 minutes). US-007';
