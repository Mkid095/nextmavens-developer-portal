import { getPool } from '@/lib/db'

/**
 * Create idempotency_keys table
 *
 * This table stores idempotency keys to prevent duplicate operations.
 * Enables safe retry of operations without duplicate side effects.
 *
 * US-001: Create Idempotency Keys Table
 */
export async function createIdempotencyKeysTable() {
  const pool = getPool()

  try {
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'control_plane'
        AND table_name = 'idempotency_keys'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create idempotency_keys table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.idempotency_keys (
          key VARCHAR(255) PRIMARY KEY,
          response JSONB NOT NULL DEFAULT '{}',
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      console.log('[Migration] Created idempotency_keys table in control_plane schema')
    } else {
      console.log('[Migration] idempotency_keys table already exists')
    }

    // Check if index exists
    const indexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'control_plane'
        AND indexname = 'idx_idempotency_keys_expires_at'
      )
    `)

    const indexExists = indexCheck.rows[0].exists

    if (!indexExists) {
      // Create index on expires_at for efficient cleanup queries
      await pool.query(`
        CREATE INDEX idx_idempotency_keys_expires_at
          ON control_plane.idempotency_keys(expires_at);
      `)
      console.log('[Migration] Created idx_idempotency_keys_expires_at index')
    } else {
      console.log('[Migration] idx_idempotency_keys_expires_at index already exists')
    }

    // Add comments for documentation
    await pool.query(`
      COMMENT ON TABLE control_plane.idempotency_keys IS 'Idempotency keys to prevent duplicate operations';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.idempotency_keys.key IS 'Unique idempotency key (typically provided by client or generated UUID)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.idempotency_keys.response IS 'Cached operation result as JSONB';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.idempotency_keys.expires_at IS 'When this idempotency entry expires (cleanup target)';
    `)

    await pool.query(`
      COMMENT ON COLUMN control_plane.idempotency_keys.created_at IS 'When this idempotency key was first created';
    `)

    console.log('[Migration] Added comments to idempotency_keys table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating idempotency_keys table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop idempotency_keys table
 *
 * This function removes the idempotency_keys table if needed for rollback.
 * WARNING: This will cause data loss of all idempotency entries.
 */
export async function dropIdempotencyKeysTable() {
  const pool = getPool()

  try {
    await pool.query(`
      DROP INDEX IF EXISTS control_plane.idx_idempotency_keys_expires_at;
    `)
    console.log('[Migration] Dropped idx_idempotency_keys_expires_at index')

    await pool.query(`
      DROP TABLE IF EXISTS control_plane.idempotency_keys;
    `)
    console.log('[Migration] Dropped idempotency_keys table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error dropping idempotency_keys table:', error)
    return { success: false, error }
  }
}
