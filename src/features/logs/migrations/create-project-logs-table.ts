import { getPool } from '@/lib/db'

/**
 * Create project_logs table
 *
 * This table stores application logs for projects with support for
 * real-time streaming via WebSocket. Logs are retained for 30 days.
 *
 * US-002: Create Logs WebSocket Endpoint
 */
export async function createProjectLogsTable() {
  const pool = getPool()

  try {
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'project_logs'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create project_logs table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.project_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          service VARCHAR(50) NOT NULL
            CHECK (service IN ('database', 'auth', 'realtime', 'storage', 'graphql')),
          level VARCHAR(10) NOT NULL
            CHECK (level IN ('info', 'warn', 'error')),
          message TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          request_id VARCHAR(255),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      console.log('[Migration] Created project_logs table in control_plane schema')
    } else {
      console.log('[Migration] project_logs table already exists')
    }

    // Check if indexes exist
    const indexCheck = await pool.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'control_plane'
      AND indexname LIKE 'idx_project_logs_%'
    `)

    const existingIndexes = new Set(indexCheck.rows.map((row) => row.indexname))

    // Create index on project_id for efficient queries
    if (!existingIndexes.has('idx_project_logs_project_id')) {
      await pool.query(`
        CREATE INDEX idx_project_logs_project_id
          ON control_plane.project_logs(project_id);
      `)
      console.log('[Migration] Created idx_project_logs_project_id index')
    }

    // Create index on timestamp for time-based queries and cleanup
    if (!existingIndexes.has('idx_project_logs_timestamp')) {
      await pool.query(`
        CREATE INDEX idx_project_logs_timestamp
          ON control_plane.project_logs(timestamp DESC);
      `)
      console.log('[Migration] Created idx_project_logs_timestamp index')
    }

    // Create composite index on project_id and timestamp for filtered queries
    if (!existingIndexes.has('idx_project_logs_project_id_timestamp')) {
      await pool.query(`
        CREATE INDEX idx_project_logs_project_id_timestamp
          ON control_plane.project_logs(project_id, timestamp DESC);
      `)
      console.log('[Migration] Created idx_project_logs_project_id_timestamp index')
    }

    // Create index on service for filtering
    if (!existingIndexes.has('idx_project_logs_service')) {
      await pool.query(`
        CREATE INDEX idx_project_logs_service
          ON control_plane.project_logs(service);
      `)
      console.log('[Migration] Created idx_project_logs_service index')
    }

    // Create index on level for filtering
    if (!existingIndexes.has('idx_project_logs_level')) {
      await pool.query(`
        CREATE INDEX idx_project_logs_level
          ON control_plane.project_logs(level);
      `)
      console.log('[Migration] Created idx_project_logs_level index')
    }

    // Create GIN index on metadata for JSON queries
    if (!existingIndexes.has('idx_project_logs_metadata')) {
      await pool.query(`
        CREATE INDEX idx_project_logs_metadata
          ON control_plane.project_logs USING GIN (metadata);
      `)
      console.log('[Migration] Created idx_project_logs_metadata GIN index')
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.project_logs IS 'Application logs for projects with real-time streaming support';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.id IS 'Unique log entry identifier';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.project_id IS 'Reference to the project that generated this log';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.timestamp IS 'When the log event occurred';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.service IS 'Service that generated the log (database, auth, realtime, storage, graphql)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.level IS 'Log level (info, warn, error)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.message IS 'Log message content';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.metadata IS 'Additional structured data as JSONB';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.request_id IS 'Request identifier for distributed tracing';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.project_logs.created_at IS 'When this log entry was created in the database';
    `)

    console.log('[Migration] Added comments to project_logs table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating project_logs table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop project_logs table
 *
 * This function removes the project_logs table if needed for rollback.
 * WARNING: This will cause data loss of all log entries.
 */
export async function dropProjectLogsTable() {
  const pool = getPool()

  try {
    // Drop all indexes first
    const indexNames = [
      'idx_project_logs_project_id',
      'idx_project_logs_timestamp',
      'idx_project_logs_project_id_timestamp',
      'idx_project_logs_service',
      'idx_project_logs_level',
      'idx_project_logs_metadata',
    ]

    for (const indexName of indexNames) {
      await pool.query(`
        DROP INDEX IF EXISTS control_plane.${indexName};
      `)
      console.log(`[Migration] Dropped ${indexName} index`)
    }

    await pool.query(`
      DROP TABLE IF EXISTS control_plane.project_logs;
    `)
    console.log('[Migration] Dropped project_logs table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error dropping project_logs table:', error)
    return { success: false, error }
  }
}
