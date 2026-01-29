import { getPool } from '@/lib/db'

/**
 * Create event_log table
 *
 * This table stores event logs for webhook delivery tracking.
 * Enables monitoring of webhook delivery status and retry logic.
 *
 * US-002: Create Event Log Table (from webhooks-events PRD)
 */
export async function createEventLogTable() {
  const pool = getPool()

  try {
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'event_log'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create event_log table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.event_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES control_plane.projects(id) ON DELETE CASCADE,
          webhook_id UUID REFERENCES control_plane.webhooks(id) ON DELETE SET NULL,
          event_type VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL DEFAULT '{}',
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          response_code INTEGER,
          response_body TEXT,
          retry_count INTEGER NOT NULL DEFAULT 0,
          delivered_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT valid_status CHECK (status IN ('pending', 'delivered', 'failed'))
        );
      `)
      console.log('[Migration] Created event_log table in control_plane schema')
    } else {
      console.log('[Migration] event_log table already exists')
    }

    // Check if indexes exist
    const indexCheck1 = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND indexname = 'idx_event_log_project_id_status'
      )
    `)

    const index1Exists = indexCheck1.rows[0].exists

    if (!index1Exists) {
      // Create index on project_id and status for efficient queries
      await pool.query(`
        CREATE INDEX idx_event_log_project_id_status
          ON control_plane.event_log(project_id, status);
      `)
      console.log('[Migration] Created idx_event_log_project_id_status index')
    } else {
      console.log('[Migration] idx_event_log_project_id_status index already exists')
    }

    const indexCheck2 = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND indexname = 'idx_event_log_status_created_at'
      )
    `)

    const index2Exists = indexCheck2.rows[0].exists

    if (!index2Exists) {
      // Create index on status and created_at for job scheduling
      await pool.query(`
        CREATE INDEX idx_event_log_status_created_at
          ON control_plane.event_log(status, created_at);
      `)
      console.log('[Migration] Created idx_event_log_status_created_at index')
    } else {
      console.log('[Migration] idx_event_log_status_created_at index already exists')
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.event_log IS 'Event log for tracking webhook delivery status';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.id IS 'Unique event log identifier (used as event_id for idempotency)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.project_id IS 'Project that this event belongs to';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.webhook_id IS 'Webhook that delivered this event (can be null if webhook deleted)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.event_type IS 'Type of event (e.g., project.created, key.rotated)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.payload IS 'Event payload data';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.status IS 'Delivery status: pending, delivered, or failed';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.response_code IS 'HTTP response code from webhook delivery';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.response_body IS 'HTTP response body from webhook delivery';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.retry_count IS 'Number of delivery attempts made';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.delivered_at IS 'Timestamp of successful delivery';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.event_log.created_at IS 'When this event log entry was created';
    `)

    console.log('[Migration] Added comments to event_log table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating event_log table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop event_log table
 *
 * This function removes the event_log table if needed for rollback.
 * WARNING: This will cause data loss of all event logs.
 */
export async function dropEventLogTable() {
  const pool = getPool()

  try {
    await pool.query(`
      DROP INDEX IF EXISTS control_plane.idx_event_log_project_id_status;
    `)
    console.log('[Migration] Dropped idx_event_log_project_id_status index')

    await pool.query(`
      DROP INDEX IF EXISTS control_plane.idx_event_log_status_created_at;
    `)
    console.log('[Migration] Dropped idx_event_log_status_created_at index')

    await pool.query(`
      DROP TABLE IF EXISTS control_plane.event_log;
    `)
    console.log('[Migration] Dropped event_log table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error dropping event_log table:', error)
    return { success: false, error }
  }
}
