/**
 * Create feature_flags table
 *
 * This table stores feature flags for dynamic platform control.
 * Provides operational control for rollouts and incident response.
 */

export function createFeatureFlagsTable() {
  return up();
}

export function up() {
  return `
    -- Create feature_flags table in control_plane schema
    CREATE TABLE IF NOT EXISTS control_plane.feature_flags (
      name VARCHAR(100) PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      scope VARCHAR(20) NOT NULL DEFAULT 'global',
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

      -- Ensure scope is one of the allowed values
      CONSTRAINT feature_flags_scope_check CHECK (scope IN (
        'global',
        'project',
        'org'
      ))
    );

    -- Create indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON control_plane.feature_flags(enabled);
    CREATE INDEX IF NOT EXISTS idx_feature_flags_scope ON control_plane.feature_flags(scope);

    -- Add comments for documentation
    COMMENT ON TABLE control_plane.feature_flags IS 'Feature flags for dynamic platform control';
    COMMENT ON COLUMN control_plane.feature_flags.name IS 'Unique identifier for the feature flag';
    COMMENT ON COLUMN control_plane.feature_flags.enabled IS 'Whether the feature is currently enabled';
    COMMENT ON COLUMN control_plane.feature_flags.scope IS 'Scope of the flag: global, project, or org';
    COMMENT ON COLUMN control_plane.feature_flags.metadata IS 'Additional configuration in JSON format';
    COMMENT ON COLUMN control_plane.feature_flags.created_at IS 'When the flag was first created';
    COMMENT ON COLUMN control_plane.feature_flags.updated_at IS 'When the flag was last modified';

    -- Create trigger to update updated_at timestamp
    CREATE OR REPLACE FUNCTION control_plane.update_feature_flags_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER feature_flags_updated_at
      BEFORE UPDATE ON control_plane.feature_flags
      FOR EACH ROW
      EXECUTE FUNCTION control_plane.update_feature_flags_updated_at();
  `
}

export function dropFeatureFlagsTable() {
  return down();
}

export function down() {
  return `
    DROP TRIGGER IF EXISTS feature_flags_updated_at ON control_plane.feature_flags;
    DROP FUNCTION IF EXISTS control_plane.update_feature_flags_updated_at();
    DROP INDEX IF EXISTS control_plane.idx_feature_flags_scope;
    DROP INDEX IF EXISTS control_plane.idx_feature_flags_enabled;
    DROP TABLE IF EXISTS control_plane.feature_flags;
  `
}
