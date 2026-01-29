import { getPool } from '@/lib/db'

/**
 * Create webhooks table
 *
 * This table stores webhook configurations for projects.
 * Enables external systems to receive event notifications.
 *
 * US-001: Create Webhooks Table (from webhooks-events PRD)
 */
export async function createWebhooksTable() {
  const pool = getPool()

  try {
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'webhooks'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create webhooks table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.webhooks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES control_plane.projects(id) ON DELETE CASCADE,
          event VARCHAR(255) NOT NULL,
          target_url TEXT NOT NULL,
          secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
          enabled BOOLEAN NOT NULL DEFAULT true,
          consecutive_failures INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT project_event_unique UNIQUE (project_id, event, target_url)
        );
      `)
      console.log('[Migration] Created webhooks table in control_plane schema')
    } else {
      console.log('[Migration] webhooks table already exists')
    }

    // Check if index exists
    const indexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND indexname = 'idx_webhooks_project_id_event'
      )
    `)

    const indexExists = indexCheck.rows[0].exists

    if (!indexExists) {
      // Create index on project_id and event for efficient webhook lookup
      await pool.query(`
        CREATE INDEX idx_webhooks_project_id_event
          ON control_plane.webhooks(project_id, event);
      `)
      console.log('[Migration] Created idx_webhooks_project_id_event index')
    } else {
      console.log('[Migration] idx_webhooks_project_id_event index already exists')
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.webhooks IS 'Webhook configurations for projects to receive event notifications';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.id IS 'Unique webhook identifier';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.project_id IS 'Project that owns this webhook';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.event IS 'Event type to trigger on (e.g., project.created, key.rotated)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.target_url IS 'URL to POST webhook payload to';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.secret IS 'Shared secret for HMAC signature verification';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.enabled IS 'Whether webhook is currently active';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.consecutive_failures IS 'Number of consecutive delivery failures (for auto-disable)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.created_at IS 'When webhook was created';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.webhooks.updated_at IS 'When webhook was last updated';
    `)

    console.log('[Migration] Added comments to webhooks table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating webhooks table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop webhooks table
 *
 * This function removes the webhooks table if needed for rollback.
 * WARNING: This will cause data loss of all webhook configurations.
 */
export async function dropWebhooksTable() {
  const pool = getPool()

  try {
    await pool.query(`
      DROP INDEX IF EXISTS control_plane.idx_webhooks_project_id_event;
    `)
    console.log('[Migration] Dropped idx_webhooks_project_id_event index')

    await pool.query(`
      DROP TABLE IF EXISTS control_plane.webhooks;
    `)
    console.log('[Migration] Dropped webhooks table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error dropping webhooks table:', error)
    return { success: false, error }
  }
}
