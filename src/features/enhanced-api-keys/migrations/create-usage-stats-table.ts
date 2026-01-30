import { getPool } from '@/lib/db'

/**
 * Migration: Create Usage Stats Table
 *
 * This migration creates a usage_stats table to track detailed API key usage statistics:
 * - Tracks each request made with an API key
 * - Records success/error status via HTTP status code
 * - Supports time-based queries (7 day, 30 day request counts)
 * - Enables success/error rate calculations
 *
 * Table: usage_stats
 * - id: UUID primary key
 * - key_id: UUID foreign key to api_keys (CASCADE delete)
 * - occurred_at: TIMESTAMPTZ for when the request occurred (indexed)
 * - status_code: INTEGER HTTP status code (200-299 = success, 400+ = error)
 * - request_path: VARCHAR(500) the API endpoint path requested
 * - request_method: VARCHAR(10) HTTP method (GET, POST, etc.)
 * - created_at: TIMESTAMPTZ when the record was created
 */
export async function createUsageStatsTable() {
  const pool = getPool()

  try {
    // Check if usage_stats table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'usage_stats'
      )
    `)

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create the usage_stats table
      await pool.query(`
        CREATE TABLE usage_stats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
          occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          status_code INTEGER NOT NULL,
          request_path VARCHAR(500),
          request_method VARCHAR(10) CHECK (request_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      console.log('[Migration] Created usage_stats table')
    } else {
      console.log('[Migration] usage_stats table already exists')
    }

    // Create index on key_id for efficient key-based queries
    const keyIdIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'usage_stats'
        AND indexname = 'idx_usage_stats_key_id'
      )
    `)

    const keyIdIndexExists = keyIdIndexCheck.rows[0].exists

    if (!keyIdIndexExists) {
      await pool.query(`
        CREATE INDEX idx_usage_stats_key_id ON usage_stats(key_id)
      `)
      console.log('[Migration] Created index on usage_stats.key_id')
    } else {
      console.log('[Migration] Index on usage_stats.key_id already exists')
    }

    // Create index on occurred_at for efficient time-based queries
    const occurredAtIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'usage_stats'
        AND indexname = 'idx_usage_stats_occurred_at'
      )
    `)

    const occurredAtIndexExists = occurredAtIndexCheck.rows[0].exists

    if (!occurredAtIndexExists) {
      await pool.query(`
        CREATE INDEX idx_usage_stats_occurred_at ON usage_stats(occurred_at DESC)
      `)
      console.log('[Migration] Created index on usage_stats.occurred_at')
    } else {
      console.log('[Migration] Index on usage_stats.occurred_at already exists')
    }

    // Create composite index on key_id and occurred_at for optimized time-period queries
    const compositeIndexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'usage_stats'
        AND indexname = 'idx_usage_stats_key_id_occurred_at'
      )
    `)

    const compositeIndexExists = compositeIndexCheck.rows[0].exists

    if (!compositeIndexExists) {
      await pool.query(`
        CREATE INDEX idx_usage_stats_key_id_occurred_at ON usage_stats(key_id, occurred_at DESC)
      `)
      console.log('[Migration] Created composite index on usage_stats(key_id, occurred_at)')
    } else {
      console.log('[Migration] Composite index on usage_stats(key_id, occurred_at) already exists')
    }

    // Create comments for documentation
    await pool.query(`
      COMMENT ON TABLE usage_stats IS 'Tracks detailed usage statistics for API keys including request count, success/error rates, and timing data.'
    `)

    await pool.query(`
      COMMENT ON COLUMN usage_stats.key_id IS 'Reference to the API key that made this request. Cascades on key deletion.'
    `)

    await pool.query(`
      COMMENT ON COLUMN usage_stats.occurred_at IS 'Timestamp of when the API request occurred. Indexed for efficient time-range queries.'
    `)

    await pool.query(`
      COMMENT ON COLUMN usage_stats.status_code IS 'HTTP status code of the response. 200-299 indicates success, 400+ indicates errors.'
    `)

    await pool.query(`
      COMMENT ON COLUMN usage_stats.request_path IS 'The API endpoint path that was requested (e.g., /api/v1/graphql)'
    `)

    await pool.query(`
      COMMENT ON COLUMN usage_stats.request_method IS 'HTTP method used for the request (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD)'
    `)

    console.log('[Migration] Added comments to usage_stats table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating usage_stats table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Drop usage_stats table
 *
 * This function drops the usage_stats table if needed for rollback.
 * WARNING: This will cause complete data loss of all usage statistics.
 */
export async function rollbackUsageStatsTable() {
  const pool = getPool()

  try {
    await pool.query(`
      DROP TABLE IF EXISTS usage_stats
    `)

    console.log('[Migration] Dropped usage_stats table')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error rolling back usage_stats table:', error)
    return { success: false, error }
  }
}
