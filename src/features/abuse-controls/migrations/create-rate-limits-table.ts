import { getPool } from '@/lib/db'

/**
 * Migration: Create rate_limits table
 *
 * Tracks rate limiting for signup and other operations.
 * Uses a sliding window approach with automatic cleanup of old records.
 */
export async function createRateLimitsTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'rate_limits'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the rate_limits table
      await pool.query(`
        CREATE TABLE rate_limits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          identifier_type VARCHAR(10) NOT NULL CHECK (identifier_type IN ('org', 'ip')),
          identifier_value VARCHAR(255) NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 1,
          window_start TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      console.log('[Migration] Created rate_limits table')

      // Create unique constraint on identifier combination within a window
      await pool.query(`
        CREATE UNIQUE INDEX idx_rate_limits_identifier_window
          ON rate_limits (identifier_type, identifier_value, window_start)
      `)

      console.log('[Migration] Created unique index on rate_limits')

      // Create index for efficient lookups
      await pool.query(`
        CREATE INDEX idx_rate_limits_lookup
          ON rate_limits (identifier_type, identifier_value, window_start DESC)
      `)

      console.log('[Migration] Created lookup index on rate_limits')

      // Create index for cleanup queries
      await pool.query(`
        CREATE INDEX idx_rate_limits_cleanup
          ON rate_limits (window_start)
      `)

      console.log('[Migration] Created cleanup index on rate_limits')
    } else {
      console.log('[Migration] rate_limits table already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating rate_limits table:', error)
    return { success: false, error }
  }
}
