-- Migration: Short description of migration
-- Description: More detailed explanation of what this migration does and why
-- Version: NNN
-- Breaking: false
-- Rollback: -- SQL to undo this migration (e.g., DROP TABLE IF EXISTS control_plane.example_table;)

-- Example: Create a new table
CREATE TABLE IF NOT EXISTS control_plane.example_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_example_table_name
ON control_plane.example_table(name);

-- Create index on created_at for time range queries
CREATE INDEX IF NOT EXISTS idx_example_table_created_at
ON control_plane.example_table(created_at DESC);

-- Migration record will be auto-inserted by the migration runner
-- with the version extracted from the filename
