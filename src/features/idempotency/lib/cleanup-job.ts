import { getPool } from '@/lib/db'

/**
 * Cleanup expired idempotency keys
 *
 * Removes idempotency keys that have expired (based on expires_at column).
 * This is typically called by a scheduled job or manually via admin endpoint.
 *
 * US-007: Implement Idempotency Key Cleanup
 */
export async function cleanupExpiredIdempotencyKeys() {
  const pool = getPool()

  try {
    const result = await pool.query(`
      DELETE FROM control_plane.idempotency_keys
      WHERE expires_at < NOW()
      RETURNING key
    `)

    const deletedCount = result.rowCount || 0

    console.log(`[Cleanup] Removed ${deletedCount} expired idempotency key(s)`)

    return {
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning up idempotency keys:', error)
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Get idempotency key statistics
 *
 * Returns statistics about idempotency keys in the system,
 * including total count and expired keys count.
 */
export async function getIdempotencyKeyStats() {
  const pool = getPool()

  try {
    // Get total count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as count FROM control_plane.idempotency_keys
    `)

    // Get expired keys count
    const expiredResult = await pool.query(`
      SELECT COUNT(*) as count FROM control_plane.idempotency_keys
      WHERE expires_at < NOW()
    `)

    // Get keys expiring soon (within 1 hour)
    const expiringSoonResult = await pool.query(`
      SELECT COUNT(*) as count FROM control_plane.idempotency_keys
      WHERE expires_at < NOW() + INTERVAL '1 hour'
      AND expires_at >= NOW()
    `)

    return {
      total: parseInt(totalResult.rows[0].count, 10),
      expired: parseInt(expiredResult.rows[0].count, 10),
      expiringSoon: parseInt(expiringSoonResult.rows[0].count, 10),
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Stats] Error getting idempotency key stats:', error)
    return {
      total: 0,
      expired: 0,
      expiringSoon: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}
