import { getPool } from './db'

export interface Migration {
  version: string
  description: string
  rollbackSql?: string
  breaking?: boolean
}

export interface MigrationRecord {
  version: string
  description: string
  applied_at: Date
  rollback_sql: string | null
  breaking: boolean
  created_at: Date
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS control_plane.schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        rollback_sql TEXT,
        breaking BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Read migration files from /migrations directory
    const { readdir } = await import('fs/promises')
    const { join } = await import('path')

    const migrationsDir = join(process.cwd(), 'migrations')
    const files = await readdir(migrationsDir)
    const migrationFiles = files
      .filter(f => f.endsWith('.sql') && f.match(/^\d{3}_/))
      .sort()

    for (const file of migrationFiles) {
      const version = file.split('_')[0]

      // Check if migration already applied
      const existing = await client.query<MigrationRecord>(
        'SELECT * FROM control_plane.schema_migrations WHERE version = $1',
        [version]
      )

      if (existing.rows.length > 0) {
        console.log(`Migration ${version} already applied, skipping`)
        continue
      }

      // Read and execute migration
      const { readFile } = await import('fs/promises')
      const migrationPath = join(migrationsDir, file)
      const migrationSql = await readFile(migrationPath, 'utf-8')

      console.log(`Running migration ${version}...`)
      await client.query(migrationSql)

      // Extract description from migration file (first comment line)
      const lines = migrationSql.split('\n')
      const descriptionLine = lines.find(line =>
        line.trim().startsWith('--') &&
        !line.trim().startsWith('--===')
      ) || lines[0]
      const description = descriptionLine
        ?.replace(/^--\s*/, '')
        ?.trim() ||
        `Migration ${version}`

      // Record migration
      await client.query(
        `INSERT INTO control_plane.schema_migrations (version, description, breaking)
         VALUES ($1, $2, $3)`,
        [version, description, false]
      )

      console.log(`Migration ${version} applied successfully`)
    }

    await client.query('COMMIT')
    console.log('All migrations completed successfully')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  applied: MigrationRecord[]
  pending: string[]
}> {
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
      .map(f => f.split('_')[0])
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
