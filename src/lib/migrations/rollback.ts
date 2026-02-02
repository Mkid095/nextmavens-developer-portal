/**
 * Migration rollback functionality
 */

import type { MigrationRecord } from './types'
import { getPool } from '../db'

/**
 * Rollback a migration
 */
export async function rollbackMigration(version: string): Promise<void> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Get migration record
    const result = await client.query<MigrationRecord>(
      'SELECT * FROM control_plane.schema_migrations WHERE version = $1',
      [version]
    )

    if (result.rows.length === 0) {
      throw new Error(`Migration ${version} not found`)
    }

    const migration = result.rows[0]

    if (!migration.rollback_sql) {
      throw new Error(`Migration ${version} does not have rollback SQL`)
    }

    console.log(`Rolling back migration ${version}...`)
    await client.query(migration.rollback_sql)

    // Remove migration record
    await client.query(
      'DELETE FROM control_plane.schema_migrations WHERE version = $1',
      [version]
    )

    await client.query('COMMIT')
    console.log(`Migration ${version} rolled back successfully`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Rollback failed:', error)
    throw error
  } finally {
    client.release()
  }
}
