/**
 * Key Expiration Background Job
 *
 * Provides the library function for automatically expiring API keys.
 * This is designed to be called by a cron job or scheduler.
 *
 * Usage:
 * - Call runKeyExpirationJob() from a cron job (e.g., every hour)
 * - The function will check all API keys and revoke expired ones
 * - Results are logged for monitoring and debugging
 *
 * US-007: Implement Automatic Key Expiration
 */

import { getPool } from '@/lib/db'

/**
 * Background job result interface
 */
export interface KeyExpirationJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of keys checked */
  keysChecked: number
  /** Number of keys expired */
  keysExpired: number
  /** Details of expired keys */
  expiredKeys: Array<{
    keyId: string
    keyName: string
    keyType: string
    expiresAt: Date
    revokedAt: Date
  }>
  /** Error message if job failed */
  error?: string
}

/**
 * Run the key expiration background job
 *
 * This function checks all API keys with an expires_at timestamp
 * and revokes any keys that have expired (expires_at < NOW()).
 *
 * Keys are expired by setting their status to 'expired'.
 *
 * @returns Result object with job statistics and any errors
 *
 * @example
 * // Call this from a cron job or scheduler
 * const result = await runKeyExpirationJob();
 * console.log(`Job completed: ${result.keysExpired} keys expired`);
 */
export async function runKeyExpirationJob(): Promise<KeyExpirationJobResult> {
  const startTime = new Date()
  console.log('='.repeat(60))
  console.log(`[Key Expiration Job] Started at ${startTime.toISOString()}`)
  console.log('='.repeat(60))

  const pool = getPool()

  try {
    // Ensure status column exists
    try {
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
        CONSTRAINT api_keys_status_check
        CHECK (status IN ('active', 'revoked', 'expired'))
      `)
    } catch (error) {
      // Column might already exist or constraint exists, ignore
      console.log('[Key Expiration Job] Status column setup:', error)
    }

    // Find all keys that should be expired
    // These are keys with expires_at < NOW() AND status != 'expired' AND status != 'revoked'
    const findResult = await pool.query(`
      SELECT id, name, key_type, expires_at
      FROM api_keys
      WHERE expires_at IS NOT NULL
        AND expires_at < NOW()
        AND status != 'expired'
        AND status != 'revoked'
    `)

    const keysToExpire = findResult.rows
    const keysChecked = keysToExpire.length

    if (keysChecked === 0) {
      const endTime = new Date()
      const durationMs = endTime.getTime() - startTime.getTime()

      console.log('='.repeat(60))
      console.log(`[Key Expiration Job] Completed - No keys to expire`)
      console.log(`[Key Expiration Job] Duration: ${durationMs}ms`)
      console.log('='.repeat(60))

      return {
        success: true,
        startedAt: startTime,
        completedAt: endTime,
        durationMs,
        keysChecked: 0,
        keysExpired: 0,
        expiredKeys: [],
      }
    }

    console.log(`[Key Expiration Job] Found ${keysChecked} keys to expire`)

    // Expire all keys by setting status to 'expired'
    const expiredKeys: Array<{
      keyId: string
      keyName: string
      keyType: string
      expiresAt: Date
      revokedAt: Date
    }> = []

    for (const key of keysToExpire) {
      await pool.query(`
        UPDATE api_keys
        SET status = 'expired',
            updated_at = NOW()
        WHERE id = $1
      `, [key.id])

      expiredKeys.push({
        keyId: key.id,
        keyName: key.name || key.key_type + ' key',
        keyType: key.key_type,
        expiresAt: new Date(key.expires_at),
        revokedAt: new Date(),
      })

      console.log(`[Key Expiration Job] Expired key ${key.id} (${key.name || key.key_type + ' key'})`)
    }

    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    console.log('='.repeat(60))
    console.log(`[Key Expiration Job] Completed`)
    console.log(`[Key Expiration Job] Duration: ${durationMs}ms`)
    console.log(`[Key Expiration Job] Keys expired: ${expiredKeys.length}`)

    if (expiredKeys.length > 0) {
      console.log(`[Key Expiration Job] Expired keys:`)
      expiredKeys.forEach((key, index) => {
        console.log(
          `  ${index + 1}. Key ${key.keyId} (${key.keyName}) - ${key.keyType} - Expired at ${key.expiresAt.toISOString()}`
        )
      })
    }

    console.log('='.repeat(60))

    return {
      success: true,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      keysChecked,
      keysExpired: expiredKeys.length,
      expiredKeys,
    }
  } catch (error) {
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[Key Expiration Job] Failed`)
    console.error(`[Key Expiration Job] Duration: ${durationMs}ms`)
    console.error(`[Key Expiration Job] Error: ${errorMessage}`)
    console.error('='.repeat(60))

    return {
      success: false,
      startedAt: startTime,
      completedAt: endTime,
      durationMs,
      keysChecked: 0,
      keysExpired: 0,
      expiredKeys: [],
      error: errorMessage,
    }
  }
}
