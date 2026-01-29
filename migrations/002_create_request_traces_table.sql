-- Migration: Create request_traces table
-- Description: Create request_traces table for tracking request flow across services
-- Version: 002

-- Create request_traces table to track request flow across services
CREATE TABLE IF NOT EXISTS control_plane.request_traces (
    request_id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    path VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    services_hit JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on project_id for querying by project
CREATE INDEX IF NOT EXISTS idx_request_traces_project_id
ON control_plane.request_traces(project_id);

-- Create index on created_at for time range queries
CREATE INDEX IF NOT EXISTS idx_request_traces_created_at
ON control_plane.request_traces(created_at DESC);

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('002', 'Create request_traces table', FALSE);
