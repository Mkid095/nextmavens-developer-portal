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
 * Migration options for running migrations
 */
export interface MigrationOptions {
  /**
   * Automatically confirm breaking migrations
   * If false, will throw an error for breaking migrations requiring manual confirmation
   */
  autoConfirmBreaking?: boolean

  /**
   * Environment name (used for production detection)
   */
  environment?: string

  /**
   * Force run even if breaking (bypasses confirmation)
   */
  force?: boolean
}

/**
 * Check if current environment is production
 */
function isProductionEnvironment(options?: MigrationOptions): boolean {
  const env = options?.environment || process.env.NODE_ENV || process.env.ENVIRONMENT || 'development'
  return env === 'production'
}

/**
 * Log a breaking change warning
 */
function logBreakingChangeWarning(migration: Migration, version: string): void {
  console.warn('')
  console.warn('⚠️  WARNING: Breaking Change Detected!')
  console.warn(`⚠️  Migration: ${version}`)
  console.warn(`⚠️  Description: ${migration.description}`)
  console.warn(`⚠️  This migration may cause issues if not properly tested.`)
  console.warn(`⚠️  Ensure you have tested this on a staging environment first.`)
  console.warn('')
}

/**
 * Run all pending migrations
 * US-004: Added breaking change warnings and confirmation
 * Each migration runs in its own transaction, so failures don't rollback previously applied migrations
 *
 * @param options - Migration options
 * @throws Error if breaking migration requires confirmation in production
 */
export async function runMigrations(options?: MigrationOptions): Promise<void> {
  const pool = getPool()

  // First, ensure schema_migrations table exists (outside migration loop)
  const setupClient = await pool.connect()
  try {
    await setupClient.query(`
      CREATE TABLE IF NOT EXISTS control_plane.schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        rollback_sql TEXT,
        breaking BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
  } finally {
    setupClient.release()
  }

  // Read migration files from /migrations directory
  const { readdir } = await import('fs/promises')
  const { join } = await import('path')

  const migrationsDir = join(process.cwd(), 'migrations')
  const files = await readdir(migrationsDir)
  const migrationFiles = files
    .filter(f => f.endsWith('.sql') && f.match(/^\d{3}_/))
    .sort()

  let successCount = 0
  let skipCount = 0
  const isProd = isProductionEnvironment(options)

  for (const file of migrationFiles) {
    const version = file.split('_')[0]

    // Read migration file first to check for breaking flag
    const { readFile } = await import('fs/promises')
    const migrationPath = join(migrationsDir, file)
    const migrationSql = await readFile(migrationPath, 'utf-8')

    // Extract breaking flag if present (looks for -- Breaking: true/false)
    const lines = migrationSql.split('\n')
    const breakingLine = lines.find(line =>
      line.trim().startsWith('-- Breaking:') ||
      line.trim().startsWith('-- breaking:')
    )
    const breaking = breakingLine
      ?.replace(/^--\s*(Breaking|breaking):\s*/, '')
      ?.trim()?.toLowerCase() === 'true'

    // Extract description for warnings
    const descriptionLine = lines.find(line =>
      line.trim().startsWith('--') &&
      !line.trim().startsWith('--===')
    ) || lines[0]
    const description = descriptionLine
      ?.replace(/^--\s*/, '')
      ?.trim() ||
      `Migration ${version}`

    // US-004: Check for breaking changes and warn/require confirmation
    if (breaking) {
      const migration: Migration = { version, description, breaking }
      logBreakingChangeWarning(migration, version)

      // In production, require explicit confirmation for breaking changes
      if (isProd && !options?.force && !options?.autoConfirmBreaking) {
        throw new Error(
          `Breaking migration ${version} requires explicit confirmation. ` +
          `Run with autoConfirmBreaking: true or force: true to proceed.`
        )
      }

      if (!options?.autoConfirmBreaking && !options?.force) {
        console.warn(`⚠️  Proceeding with breaking migration ${version} in non-production environment`)
      }
    }

    // Each migration gets its own transaction
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Check if migration already applied
      const existing = await client.query<MigrationRecord>(
        'SELECT * FROM control_plane.schema_migrations WHERE version = $1',
        [version]
      )

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK')
        console.log(`Migration ${version} already applied, skipping`)
        skipCount++
        continue
      }

      console.log(`Running migration ${version}...`)
      await client.query(migrationSql)

      // Extract rollback SQL if present (looks for -- Rollback: comment)
      const rollbackLine = lines.find(line =>
        line.trim().startsWith('-- Rollback:') ||
        line.trim().startsWith('-- rollback:')
      )
      const rollbackSql = rollbackLine
        ?.replace(/^--\s*(Rollback|rollback):\s*/, '')
        ?.trim()

      // Record migration
      await client.query(
        `INSERT INTO control_plane.schema_migrations (version, description, rollback_sql, breaking)
         VALUES ($1, $2, $3, $4)`,
        [version, description, rollbackSql || null, breaking]
      )

      await client.query('COMMIT')
      console.log(`Migration ${version} applied successfully`)
      successCount++
    } catch (error) {
      await client.query('ROLLBACK')
      console.error(`Migration ${version} failed (rolled back):`, error)
      throw error
    } finally {
      client.release()
    }
  }

  console.log(`All migrations completed: ${successCount} applied, ${skipCount} skipped`)
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
