/**
 * Migration status functionality
 */

import type { MigrationStatus, MigrationRecord } from './types'
import { getPool } from '../db'
import { parseMigrationVersion } from './utils'

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<MigrationStatus> {
  const pool = getPool()
  const { readdir } = await import('fs/promises')
  const { join } = await import('path')

  const client = await pool.connect()

  try {
    // Get applied migrations
    const result = await client.query<MigrationRecord>(
      'SELECT * FROM control_plane.schema_migrations ORDER BY applied_at DESC'
    )

    // Get available migration files
    const migrationsDir = join(process.cwd(), 'migrations')
    const files = await readdir(migrationsDir)
    const migrationFiles = files
      .filter(f => f.endsWith('.sql') && f.match(/^\d{3}_/))
      .map(f => parseMigrationVersion(f))
      .sort()

    const appliedVersions = new Set(result.rows.map(r => r.version))
    const pending = migrationFiles.filter(v => !appliedVersions.has(v))

    return {
      applied: result.rows,
      pending
    }
  } finally {
    client.release()
  }
}
