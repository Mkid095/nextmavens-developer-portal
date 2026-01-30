-- Migration: Create secret_consumers table
-- Description: Track which services use each secret for rotation blast radius awareness
-- Version: 018
-- PRD: US-002 from prd-secrets-versioning.json
-- Rollback: DROP TABLE IF EXISTS control_plane.secret_consumers;

-- Create secret_consumers table in control_plane schema
-- This table tracks which services (edge_function, worker, webhook, etc.) use each secret
-- allowing us to understand the blast radius when rotating secrets
CREATE TABLE IF NOT EXISTS control_plane.secret_consumers (
  secret_id UUID NOT NULL REFERENCES control_plane.secrets(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Primary key on (secret_id, service) ensures each service is only registered once per secret
  CONSTRAINT secret_consumers_pkey PRIMARY KEY (secret_id, service)
);

-- Create index on service for finding all secrets used by a specific service type
CREATE INDEX IF NOT EXISTS idx_secret_consumers_service
ON control_plane.secret_consumers(service);

-- Create index on last_used_at for identifying inactive consumers
CREATE INDEX IF NOT EXISTS idx_secret_consumers_last_used_at
ON control_plane.secret_consumers(last_used_at DESC);

-- Add check constraint to ensure only valid service types
-- Services: edge_function, worker, webhook, api_gateway, scheduled_job, custom
ALTER TABLE control_plane.secret_consumers
DROP CONSTRAINT IF EXISTS secret_consumers_service_check;

ALTER TABLE control_plane.secret_consumers
ADD CONSTRAINT secret_consumers_service_check
CHECK (service IN ('edge_function', 'worker', 'webhook', 'api_gateway', 'scheduled_job', 'custom'));

-- Record migration in schema_migrations
INSERT INTO control_plane.schema_migrations (version, description, applied_at)
VALUES (
  '018',
  'Create secret_consumers table for tracking service usage of secrets',
  NOW()
)
ON CONFLICT (version) DO NOTHING;
