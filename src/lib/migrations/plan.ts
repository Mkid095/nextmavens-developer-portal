/**
 * Migration plan functionality
 * US-007: Dry run mode - shows what migrations would be applied
 */

import type { MigrationPlan, MigrationOptions, MigrationRecord } from './types'
import { getPool } from '../db'
import { estimateMigrationImpact, extractMigrationMetadata, parseMigrationVersion } from './utils'

/**
 * US-007: Get migration plan - shows what migrations would be applied
 * This is the dry-run functionality
 */
export async function getMigrationPlan(options?: MigrationOptions): Promise<MigrationPlan[]> {
  const pool = getPool()
  const { readdir, readFile } = await import('fs/promises')
  const { join } = await import('path')

  const migrationsDir = join(process.cwd(), 'migrations')
  const files = await readdir(migrationsDir)
  const migrationFiles = files
    .filter(f => f.endsWith('.sql') && f.match(/^\d{3}_/))
    .sort()

  const client = await pool.connect()

  try {
    // Get applied migrations
    const result = await client.query<MigrationRecord>(
      'SELECT * FROM control_plane.schema_migrations'
    )
    const appliedVersions = new Set(result.rows.map(r => r.version))

    const plans: MigrationPlan[] = []

    for (const file of migrationFiles) {
      const version = parseMigrationVersion(file)

      // Skip if already applied
      if (appliedVersions.has(version)) {
        continue
      }

      const migrationPath = join(migrationsDir, file)
      const migrationSql = await readFile(migrationPath, 'utf-8')

      // Extract metadata from comments
      const metadata = extractMigrationMetadata(migrationSql)

      // Estimate impact
      const estimatedImpact = estimateMigrationImpact(migrationSql)

      plans.push({
        version,
        description: metadata.description,
        file,
        breaking: metadata.breaking,
        rollbackSql: metadata.rollbackSql,
        estimatedImpact
      })
    }

    return plans
  } finally {
    client.release()
  }
}

/**
 * Display migration plan to console
 */
export function displayMigrationPlan(plans: MigrationPlan[], verbose?: boolean): void {
  if (plans.length === 0) {
    console.log('No pending migrations to apply.')
    return
  }

  console.log(`Found ${plans.length} pending migration${plans.length > 1 ? 's' : ''}:\n`)

  for (const plan of plans) {
    console.log(`📋 Migration ${plan.version}: ${plan.description}`)
    console.log(`   File: ${plan.file}`)

    if (plan.estimatedImpact) {
      console.log(`   Impact: ${plan.estimatedImpact}`)
    }

    if (plan.breaking) {
      console.log(`   ⚠️  BREAKING CHANGE`)
    }

    if (plan.rollbackSql && verbose) {
      console.log(`   Rollback: ${plan.rollbackSql}`)
    }

    console.log('')
  }

  if (verbose) {
    console.log('Dry run complete. No actual changes were made.')
    console.log('To apply these migrations, remove the dryRun option.')
  }
}
