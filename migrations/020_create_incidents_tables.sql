-- Migration: Create incidents and service status tables for system status page
-- Description: Creates tables to track service incidents and current service health status
-- Version: 020
-- Breaking: false
-- Rollback: DROP TABLE IF EXISTS control_plane.incident_updates; DROP TABLE IF EXISTS control_plane.incidents; DROP TABLE IF EXISTS control_plane.service_status;

-- Service status table to track current health of each service
CREATE TABLE IF NOT EXISTS control_plane.service_status (
    service VARCHAR(50) PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'outage')),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    message TEXT
);

-- Insert default services with operational status
INSERT INTO control_plane.service_status (service, status, message) VALUES
    ('api_gateway', 'operational', 'API Gateway is running normally'),
    ('auth', 'operational', 'Authentication service is running normally'),
    ('realtime', 'operational', 'Realtime service is running normally'),
    ('graphql', 'operational', 'GraphQL service is running normally'),
    ('storage', 'operational', 'Storage service is running normally'),
    ('control_plane', 'operational', 'Control Plane is running normally')
ON CONFLICT (service) DO NOTHING;

-- Incidents table to track service incidents
CREATE TABLE IF NOT EXISTS control_plane.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'maintenance')),
    title TEXT NOT NULL,
    description TEXT,
    impact VARCHAR(20) DEFAULT 'medium' CHECK (impact IN ('high', 'medium', 'low')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    affected_services JSONB DEFAULT '[]'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_incidents_service ON control_plane.incidents(service);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON control_plane.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON control_plane.incidents(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved_at ON control_plane.incidents(resolved_at DESC);

-- Incident updates table to track progress updates on incidents
CREATE TABLE IF NOT EXISTS control_plane.incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES control_plane.incidents(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Index for incident updates
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON control_plane.incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_created_at ON control_plane.incident_updates(created_at DESC);
