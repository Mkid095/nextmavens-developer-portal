import { getPool } from '@/lib/db'

/**
 * Create feature_flags table
 *
 * This table stores feature flags for dynamic platform control.
 * Provides operational control for rollouts and incident response.
 */
export async function createFeatureFlagsTable() {
  const pool = getPool()

  try {
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'feature_flags'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create feature_flags table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.feature_flags (
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
      `)
      console.log('[Migration] Created feature_flags table in control_plane schema')
    } else {
      console.log('[Migration] feature_flags table already exists')
    }

    // Check if indexes exist
    const enabledIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND indexname = 'idx_feature_flags_enabled'
      )
    `)

    if (!enabledIndexCheck.rows[0].exists) {
      await pool.query(`
        CREATE INDEX idx_feature_flags_enabled ON control_plane.feature_flags(enabled);
      `)
      console.log('[Migration] Created idx_feature_flags_enabled index')
    }

    const scopeIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND indexname = 'idx_feature_flags_scope'
      )
    `)

    if (!scopeIndexCheck.rows[0].exists) {
      await pool.query(`
        CREATE INDEX idx_feature_flags_scope ON control_plane.feature_flags(scope);
      `)
      console.log('[Migration] Created idx_feature_flags_scope index')
    }

    // Create trigger function for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION control_plane.update_feature_flags_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create trigger
    const triggerCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_schema = 'control_plane'
        AND event_object_table = 'feature_flags'
        AND trigger_name = 'feature_flags_updated_at'
      )
    `)

    if (!triggerCheck.rows[0].exists) {
      await pool.query(`
        CREATE TRIGGER feature_flags_updated_at
          BEFORE UPDATE ON control_plane.feature_flags
          FOR EACH ROW
          EXECUTE FUNCTION control_plane.update_feature_flags_updated_at();
      `)
      console.log('[Migration] Created feature_flags_updated_at trigger')
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.feature_flags IS 'Feature flags for dynamic platform control';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.feature_flags.name IS 'Unique identifier for the feature flag';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.feature_flags.enabled IS 'Whether the feature is currently enabled';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.feature_flags.scope IS 'Scope of the flag: global, project, or org';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.feature_flags.metadata IS 'Additional configuration in JSON format';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.feature_flags.created_at IS 'When the flag was first created';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.feature_flags.updated_at IS 'When the flag was last modified';
    `)

    console.log('[Migration] Added comments to feature_flags table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating feature_flags table:', error)
    return { success: false, error }
  }
}

export async function dropFeatureFlagsTable() {
  const pool = getPool()

  try {
    await pool.query(`
      DROP TRIGGER IF EXISTS feature_flags_updated_at ON control_plane.feature_flags;
    `)
    console.log('[Migration] Dropped feature_flags_updated_at trigger')

    await pool.query(`
      DROP FUNCTION IF EXISTS control_plane.update_feature_flags_updated_at();
    `)
    console.log('[Migration] Dropped update_feature_flags_updated_at function')

    await pool.query(`
      DROP INDEX IF EXISTS control_plane.idx_feature_flags_scope;
    `)
    console.log('[Migration] Dropped idx_feature_flags_scope index')

    await pool.query(`
      DROP INDEX IF EXISTS control_plane.idx_feature_flags_enabled;
    `)
    console.log('[Migration] Dropped idx_feature_flags_enabled index')

    await pool.query(`
      DROP TABLE IF EXISTS control_plane.feature_flags;
    `)
    console.log('[Migration] Dropped feature_flags table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error dropping feature_flags table:', error)
    return { success: false, error }
  }
}
