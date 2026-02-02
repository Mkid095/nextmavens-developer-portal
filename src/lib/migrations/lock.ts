/**
 * Migration lock functionality
 * US-008: Prevents multiple processes from running migrations simultaneously
 */

import type { MigrationLock, MigrationOptions } from './types'
import { getPool } from '../db'

/**
 * US-008: Acquire migration lock
 * Prevents multiple processes from running migrations simultaneously
 *
 * @param pool - Database pool
 * @param options - Migration options
 * @returns Lock release function
 * @throws Error if lock cannot be acquired within timeout
 */
export async function acquireMigrationLock(
  pool: any,
  options?: MigrationOptions
): Promise<() => Promise<void>> {
  const client = await pool.connect()
  const lockTimeout = options?.lockTimeout || 30000
  const checkInterval = options?.lockCheckInterval || 500
  const startTime = Date.now()
  const pid = process.pid
  const host = require('os').hostname() || 'unknown'

  // Ensure migration_locks table exists
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS control_plane.migration_locks (
        id SERIAL PRIMARY KEY,
        pid INTEGER NOT NULL,
        host TEXT NOT NULL,
        acquired_at TIMESTAMPTZ DEFAULT NOW(),
        migration_version TEXT,
        completed_at TIMESTAMPTZ
      )
    `)

    // Create index on completed_at for cleanup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_locks_completed_at
      ON control_plane.migration_locks(completed_at)
      WHERE completed_at IS NOT NULL
    `)
  } catch (error) {
    client.release()
    throw new Error(`Failed to create migration locks table: ${error}`)
  }

  // Try to acquire lock with retry logic
  while (true) {
    try {
      // Clean up old completed locks (older than 1 hour)
      await client.query(`
        DELETE FROM control_plane.migration_locks
        WHERE completed_at < NOW() - INTERVAL '1 hour'
      `)

      // Check for active locks (not completed)
      const result = await client.query(
        'SELECT * FROM control_plane.migration_locks WHERE completed_at IS NULL ORDER BY acquired_at DESC LIMIT 1'
      )

      if (result.rows.length === 0) {
        // No active lock, acquire it
        await client.query(
          'INSERT INTO control_plane.migration_locks (pid, host, migration_version) VALUES ($1, $2, NULL)',
          [pid, host]
        )

        console.log(`Migration lock acquired (pid: ${pid}, host: ${host})`)

        // Return release function
        return async () => {
          try {
            await client.query(
              'UPDATE control_plane.migration_locks SET completed_at = NOW() WHERE pid = $1 AND completed_at IS NULL',
              [pid]
            )
            console.log(`Migration lock released (pid: ${pid})`)
          } finally {
            client.release()
          }
        }
      }

      const existingLock = result.rows[0] as MigrationLock
      const elapsed = Date.now() - startTime

      if (elapsed >= lockTimeout) {
        client.release()
        throw new Error(
          `Could not acquire migration lock after ${lockTimeout}ms. ` +
          `Lock held by pid ${existingLock.pid} on ${existingLock.host} since ${existingLock.acquired_at}`
        )
      }

      // Lock held by another process, wait and retry
      console.log(
        `Migration lock held by pid ${existingLock.pid} on ${existingLock.host}. ` +
        `Waiting... (${elapsed}/${lockTimeout}ms)`
      )

      await new Promise(resolve => setTimeout(resolve, checkInterval))
    } catch (error: any) {
      if (error.message?.includes('Could not acquire migration lock')) {
        throw error
      }
      // On other errors, retry
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
  }
}
