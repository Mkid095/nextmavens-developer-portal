/**
 * Database Setup Script
 *
 * This script initializes the NextMavens Developer Portal database by running all migrations.
 * Run this after setting up PostgreSQL to create all required tables and schemas.
 *
 * Usage:
 *   pnpm tsx scripts/setup-database.ts
 *
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - NODE_ENV: Environment (development/production)
 *
 * Security Note:
 *   - Run this only once per database
 * - Keep database credentials secure
 * - Test migrations on staging before production
 */

import { runMigrations, getMigrationStatus, getMigrationPlan } from '../src/lib/migrations'

interface SetupOptions {
  /**
   * Dry run - show what would be applied without making changes
   */
  dryRun?: boolean

  /**
   * Verbose output
   */
  verbose?: boolean

  /**
   * Environment name (for production detection)
   */
  environment?: string

  /**
   * Force run even with breaking changes
   */
  force?: boolean

  /**
   * Auto-confirm breaking changes
   */
  autoConfirmBreaking?: boolean
}

/**
 * Main database setup function
 */
async function setupDatabase(options: SetupOptions = {}): Promise<void> {
  console.log('🔧 NextMavens Developer Portal - Database Setup')
  console.log('=======================================\n')

  // Check migration status first
  console.log('📊 Checking current migration status...')
  const status = await getMigrationStatus()
  console.log(`   Applied migrations: ${status.applied.length}`)
  console.log(`   Pending migrations: ${status.pending.length}\n`)

  if (status.pending.length === 0) {
    console.log('✅ Database is already up to date!\n')
    return
  }

  // Show what will be applied
  console.log('📋 Planning to apply the following migrations:')
  const plan = await getMigrationPlan(options)

  for (const migration of plan) {
    console.log(`   ${migration.version}: ${migration.description}`)
    if (migration.breaking) {
      console.log(`      ⚠️  BREAKING CHANGE`)
    }
  }
  console.log('')

  // Confirm before proceeding
  if (!options.dryRun) {
    console.log('🚀 Starting database setup...')
    console.log('   This may take a minute...\n')
  }

  try {
    // Run migrations
    await runMigrations(options)

    if (options.dryRun) {
      console.log('Dry run complete. To apply migrations, remove the dryRun option.')
    } else {
      console.log('\n✅ Database setup completed successfully!')
      console.log(`   Applied ${plan.length} migration${plan.length > 1 ? 's' : ''}`)
      console.log('\n🎉 Your database is now ready for the Developer Portal!')
    }
  } catch (error) {
    console.error('\n❌ Database setup failed:', error)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Ensure DATABASE_URL is set correctly')
    console.error('   2. Check database server is running')
    console.error('   3. Verify database user has CREATE TABLE permissions')
    console.error('   4. For breaking changes, use force: true or autoConfirmBreaking: true')
    process.exit(1)
  }
}

/**
 * CLI entrypoint
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const options: SetupOptions = {}

  // Parse command line arguments
  for (const arg of args) {
    switch (arg) {
      case '--dry-run':
        options.dryRun = true
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--force':
        options.force = true
        break
      case '--auto-confirm-breaking':
        options.autoConfirmBreaking = true
        break
      case '--prod':
      case '--production':
        options.environment = 'production'
        break
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`)
          console.log('\nUsage:')
          console.log('  pnpm tsx scripts/setup-database.ts [options]')
          console.log('')
          console.log('Options:')
          console.log('  --dry-run              Show what would be applied')
          console.log('  --verbose, -v          Show detailed output')
          console.log('  --force                Run even breaking changes')
          console.log('  --auto-confirm-breaking  Auto-confirm breaking changes')
          console.log('  --prod, --production     Mark as production environment')
          process.exit(1)
        }
    }
  }

  // Set environment from env variable if not specified
  if (!options.environment) {
    options.environment = process.env.NODE_ENV || process.env.ENVIRONMENT || 'development'
  }

  await setupDatabase(options)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { setupDatabase }
