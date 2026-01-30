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
 * Migration lock record
 */
export interface MigrationLock {
  id: number
  pid: number
  host: string
  acquired_at: Date
  migration_version: string | null
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

  /**
   * Maximum time to wait for lock (milliseconds)
   * Default: 30000 (30 seconds)
   */
  lockTimeout?: number

  /**
   * Interval to check lock availability (milliseconds)
   * Default: 500 (0.5 seconds)
   */
  lockCheckInterval?: number

  /**
   * US-007: Dry run mode - show what migrations would be applied without actually running them
   */
  dryRun?: boolean

  /**
   * US-007: Verbose output for dry-run mode
   */
  verbose?: boolean
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
 * US-008: Acquire migration lock
 * Prevents multiple processes from running migrations simultaneously
 *
 * @param pool - Database pool
 * @param options - Migration options
 * @returns Lock release function
 * @throws Error if lock cannot be acquired within timeout
 */
async function acquireMigrationLock(
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

/**
 * Run all pending migrations
 * US-004: Added breaking change warnings and confirmation
 * US-008: Added migration locking to prevent concurrent migrations
 * Each migration runs in its own transaction, so failures don't rollback previously applied migrations
 *
 * @param options - Migration options
 * @throws Error if breaking migration requires confirmation in production
 * @throws Error if migration lock cannot be acquired
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

  // US-008: Acquire migration lock
  const releaseLock = await acquireMigrationLock(pool, options)

  try {
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
  } finally {
    // US-008: Always release the lock when done
    await releaseLock()
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

/**
 * US-007: Migration plan - describes a migration that would be applied (used for dry-run)
 */
export interface MigrationPlan {
  version: string
  description: string
  file: string
  breaking?: boolean
  rollbackSql?: string
  estimatedImpact?: string
}
