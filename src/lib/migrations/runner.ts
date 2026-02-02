/**
 * Migration runner functionality
 * US-004: Breaking change warnings and confirmation
 * US-007: Dry run mode
 * US-008: Migration locking to prevent concurrent migrations
 */

import type { Migration, MigrationOptions } from './types'
import { getPool } from '../db'
import { isProductionEnvironment, logBreakingChangeWarning, extractMigrationMetadata, parseMigrationVersion } from './utils'
import { acquireMigrationLock } from './lock'
import { getMigrationPlan, displayMigrationPlan } from './plan'

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

  // US-007: If dry-run, just show the plan without executing
  if (options?.dryRun) {
    console.log('🔍 DRY RUN MODE - Showing what migrations would be applied:')
    console.log('')

    const plans = await getMigrationPlan(options)
    displayMigrationPlan(plans, options?.verbose)
    return
  }

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
      const version = parseMigrationVersion(file)

      // Read migration file first to check for breaking flag
      const { readFile } = await import('fs/promises')
      const migrationPath = join(migrationsDir, file)
      const migrationSql = await readFile(migrationPath, 'utf-8')

      // Extract metadata
      const metadata = extractMigrationMetadata(migrationSql)

      // US-004: Check for breaking changes and warn/require confirmation
      if (metadata.breaking) {
        const migration: Migration = { version, description: metadata.description, breaking: metadata.breaking }
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
        const existing = await client.query(
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

        // Record migration (use ON CONFLICT in case migration file already inserted)
        await client.query(
          `INSERT INTO control_plane.schema_migrations (version, description, rollback_sql, breaking)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (version) DO UPDATE SET
             description = EXCLUDED.description,
             rollback_sql = EXCLUDED.rollback_sql,
             breaking = EXCLUDED.breaking`,
          [version, metadata.description, metadata.rollbackSql || null, metadata.breaking]
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
