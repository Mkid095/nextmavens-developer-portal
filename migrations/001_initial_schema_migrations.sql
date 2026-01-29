-- Migration: Create schema_migrations table
-- Description: Track database migrations with rollback support
-- Version: 001

-- Create schema_migrations table to track migration history
CREATE TABLE IF NOT EXISTS control_plane.schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    rollback_sql TEXT,
    breaking BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on applied_at for sorting by migration order
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at
ON control_plane.schema_migrations(applied_at DESC);

-- Insert initial migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('001', 'Create schema_migrations table', FALSE);
