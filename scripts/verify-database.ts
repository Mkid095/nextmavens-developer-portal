#!/usr/bin/env tsx
/**
 * Database Verification Script
 *
 * Comprehensive verification that all database tables required by the
 * developer portal are properly created and accessible.
 *
 * Usage:
 *   pnpm tsx scripts/verify-database.ts
 *
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL connection string
 *
 * Exit Codes:
 *   - 0: All checks passed
 *   - 1: Critical issues found
 *   - 2: Warnings (optional items missing)
 */

import { getPool } from '../src/lib/db'

interface TableCheck {
  schema: string
  table: string
  required: boolean
  description: string
}

interface VerificationResult {
  category: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

// All tables that should exist based on migrations and API usage
const REQUIRED_TABLES: TableCheck[] = [
  // Public schema
  { schema: 'public', table: 'developers', required: true, description: 'Developer accounts for authentication' },

  // Control plane schema
  { schema: 'control_plane', table: 'schema_migrations', required: true, description: 'Migration tracking' },
  { schema: 'control_plane', table: 'request_traces', required: true, description: 'API request tracing' },
  { schema: 'control_plane', table: 'organizations', required: true, description: 'Organizations for multi-tenant teams' },
  { schema: 'control_plane', table: 'organization_members', required: true, description: 'Organization membership' },
  { schema: 'control_plane', table: 'projects', required: true, description: 'Project definitions' },
  { schema: 'control_plane', table: 'provisioning_steps', required: true, description: 'Project provisioning state' },
  { schema: 'control_plane', table: 'usage_snapshots', required: true, description: 'Usage statistics snapshots' },
  { schema: 'control_plane', table: 'quotas', required: true, description: 'Resource quotas and limits' },
  { schema: 'control_plane', table: 'webhooks', required: true, description: 'Webhook configurations' },
  { schema: 'control_plane', table: 'event_log', required: true, description: 'Webhook event log' },
  { schema: 'control_plane', table: 'secrets', required: true, description: 'Encrypted secrets storage' },
  { schema: 'control_plane', table: 'support_requests', required: true, description: 'Customer support tickets' },
  { schema: 'control_plane', table: 'usage_metrics', required: true, description: 'API usage metrics' },
  { schema: 'control_plane', table: 'api_keys', required: true, description: 'API keys for authentication' },
  { schema: 'control_plane', table: 'api_usage_logs', required: true, description: 'API request logging' },
  { schema: 'control_plane', table: 'audit_logs', required: true, description: 'Audit trail for compliance' },
  { schema: 'control_plane', table: 'organization_invitations', required: true, description: 'Pending org invitations' },
  { schema: 'control_plane', table: 'secret_consumers', required: true, description: 'Secret version consumers' },
  { schema: 'control_plane', table: 'incidents', required: true, description: 'Security incidents' },
]

const results: VerificationResult[] = []

console.log('🔍 NextMavens Developer Portal - Database Verification')
console.log('===================================================\n')

/**
 * Check database connection
 */
async function checkConnection(): Promise<void> {
  try {
    const pool = getPool()
    await pool.query('SELECT 1')
    results.push({
      category: 'Connection',
      status: 'pass',
      message: '✅ Database connection successful',
    })
  } catch (error: any) {
    results.push({
      category: 'Connection',
      status: 'fail',
      message: `❌ Database connection failed: ${error.message}`,
    })
    throw error
  }
}

/**
 * Check if a table exists
 */
async function checkTableExists(schema: string, table: string): Promise<boolean> {
  const pool = getPool()
  const result = await pool.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = $1
       AND table_name = $2
    )`,
    [schema, table]
  )
  return result.rows[0].exists
}

/**
 * Check table structure
 */
async function checkTableStructure(schema: string, table: string): Promise<void> {
  const pool = getPool()

  // Get column info
  const columns = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = $1
       AND table_name = $2
       ORDER BY ordinal_position`,
    [schema, table]
  )

  // Get constraint info
  const constraints = await pool.query(
    `SELECT constraint_name, constraint_type
       FROM information_schema.table_constraints
       WHERE table_schema = $1
       AND table_name = $2`,
    [schema, table]
  )

  return { columns: columns.rows, constraints: constraints.rows }
}

/**
 * Verify all required tables exist
 */
async function verifyTables(): Promise<void> {
  console.log('📊 Checking tables...\n')

  let passed = 0
  let failed = 0
  let missing: TableCheck[] = []

  for (const tableCheck of REQUIRED_TABLES) {
    const exists = await checkTableExists(tableCheck.schema, tableCheck.table)

    if (exists) {
      passed++
      console.log(`   ✅ ${tableCheck.schema}.${tableCheck.table}`)
    } else {
      failed++
      missing.push(tableCheck)
      console.log(`   ❌ ${tableCheck.schema}.${tableCheck.table} - ${tableCheck.description}`)

      if (tableCheck.required) {
        results.push({
          category: 'Tables',
          status: 'fail',
          message: `❌ Missing required table: ${tableCheck.schema}.${tableCheck.table}`,
        })
      }
    }
  }

  console.log(`\n   Summary: ${passed} found, ${failed} missing\n`)

  // List missing tables with details
  if (missing.length > 0) {
    console.log('Missing tables:')
    console.log('----------------')
    for (const table of missing) {
      const required = table.required ? 'REQUIRED' : 'optional'
      console.log(`  [${required}] ${table.schema}.${table.table}`)
      console.log(`           ${table.description}`)
    }
    console.log('')
  }

  if (failed === 0) {
    results.push({
      category: 'Tables',
      status: 'pass',
      message: `✅ All ${REQUIRED_TABLES.length} required tables exist`,
    })
  }
}

/**
 * Verify migration tracking
 */
async function verifyMigrations(): Promise<void> {
  console.log('📋 Checking migration tracking...\n')

  const pool = getPool()

  try {
    // Check if schema_migrations table exists
    const tableExists = await checkTableExists('control_plane', 'schema_migrations')

    if (!tableExists) {
      console.log('   ❌ schema_migrations table not found')
      console.log('      Run: pnpm tsx scripts/setup-database.ts\n')
      results.push({
        category: 'Migrations',
        status: 'fail',
        message: '❌ Migration tracking table not found',
      })
      return
    }

    // Get applied migrations
    const result = await pool.query(
      'SELECT version, description, applied_at FROM control_plane.schema_migrations ORDER BY applied_at'
    )

    const appliedMigrations = result.rows
    console.log(`   ✅ Found ${appliedMigrations.length} applied migrations\n`)

    // Show last 5 migrations
    console.log('   Recent migrations:')
    for (const migration of appliedMigrations.slice(-5).reverse()) {
      console.log(`     ${migration.version}: ${migration.description}`)
    }
    console.log('')

    // Count migration files
    const fs = await import('fs')
    const path = await import('path')
    const migrationsDir = path.join(process.cwd(), 'migrations')

    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql') && f !== '000_template.sql')
        .sort()

      console.log(`   📁 Migration files: ${files.length}`)
      console.log(`   ✅ Applied: ${appliedMigrations.length}`)
      console.log(`   ⏳ Pending: ${files.length - appliedMigrations.length}\n`)

      if (appliedMigrations.length < files.length) {
        results.push({
          category: 'Migrations',
          status: 'warn',
          message: `⚠️  ${files.length - appliedMigrations.length} pending migrations`,
        })
      } else {
        results.push({
          category: 'Migrations',
          status: 'pass',
          message: `✅ All ${files.length} migrations applied`,
        })
      }
    }

  } catch (error: any) {
    console.log(`   ❌ Error checking migrations: ${error.message}\n`)
    results.push({
      category: 'Migrations',
      status: 'fail',
      message: `❌ Migration check failed: ${error.message}`,
    })
  }
}

/**
 * Verify database schemas
 */
async function verifySchemas(): Promise<void> {
  console.log('🏗️  Checking schemas...\n')

  const pool = getPool()

  try {
    const result = await pool.query(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
       ORDER BY schema_name`
    )

    const schemas = result.rows.map(r => r.schema_name)
    console.log('   Found schemas:')
    for (const schema of schemas) {
      console.log(`     - ${schema}`)
    }
    console.log('')

    // Check for control_plane schema
    if (!schemas.includes('control_plane')) {
      console.log('   ❌ control_plane schema not found\n')
      results.push({
        category: 'Schemas',
        status: 'fail',
        message: '❌ control_plane schema missing',
      })
    } else {
      results.push({
        category: 'Schemas',
        status: 'pass',
        message: '✅ All required schemas exist',
      })
    }

  } catch (error: any) {
    console.log(`   ❌ Error checking schemas: ${error.message}\n`)
    results.push({
      category: 'Schemas',
      status: 'fail',
      message: `❌ Schema check failed: ${error.message}`,
    })
  }
}

/**
 * Check critical API endpoints database access
 */
async function verifyApiEndpoints(): Promise<void> {
  console.log('🔗 Checking API endpoint database access...\n')

  const pool = getPool()

  // Test developer endpoints
  try {
    // Test login query
    await pool.query('SELECT id FROM public.developers LIMIT 1')
    console.log('   ✅ Developer login query works')
  } catch (error: any) {
    console.log(`   ❌ Developer login query failed: ${error.message}`)
    results.push({
      category: 'Endpoints',
      status: 'fail',
      message: '❌ Developer authentication queries fail',
    })
  }

  try {
    // Test projects query
    await pool.query('SELECT id FROM control_plane.projects LIMIT 1')
    console.log('   ✅ Projects query works')
  } catch (error: any) {
    console.log(`   ❌ Projects query failed: ${error.message}`)
    results.push({
      category: 'Endpoints',
      status: 'fail',
      message: '❌ Project queries fail',
    })
  }

  try {
    // Test API keys query
    await pool.query('SELECT id FROM control_plane.api_keys LIMIT 1')
    console.log('   ✅ API keys query works')
  } catch (error: any) {
    console.log(`   ❌ API keys query failed: ${error.message}`)
    results.push({
      category: 'Endpoints',
      status: 'fail',
      message: '❌ API key queries fail',
    })
  }

  console.log('')

  // Count passed
  const endpointChecks = results.filter(r => r.category === 'Endpoints')
  if (endpointChecks.length === 0 || endpointChecks.every(r => r.status === 'pass')) {
    results.push({
      category: 'Endpoints',
      status: 'pass',
      message: '✅ All API endpoint database queries work',
    })
  }
}

/**
 * Generate summary report
 */
function generateSummary(): void {
  console.log('===================================================')
  console.log('📋 Verification Summary')
  console.log('===================================================\n')

  const critical = results.filter(r => r.status === 'fail')
  const warnings = results.filter(r => r.status === 'warn')
  const passed = results.filter(r => r.status === 'pass')

  // Show failures
  if (critical.length > 0) {
    console.log('❌ CRITICAL ISSUES:')
    for (const result of critical) {
      console.log(`   ${result.message}`)
    }
    console.log('')
  }

  // Show warnings
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:')
    for (const result of warnings) {
      console.log(`   ${result.message}`)
    }
    console.log('')
  }

  // Show passed checks
  if (passed.length > 0) {
    console.log('✅ PASSED CHECKS:')
    for (const result of passed) {
      console.log(`   ${result.message}`)
    }
    console.log('')
  }

  // Overall status
  console.log('===================================================')
  if (critical.length === 0) {
    console.log('✅ Database verification PASSED')
    console.log('   All required tables and schemas are present.')
    console.log('')
    console.log('Next steps:')
    console.log('   1. Run migrations if pending: pnpm tsx scripts/setup-database.ts')
    console.log('   2. Start the development server: pnpm dev')
    console.log('   3. Register a developer account: POST /api/developer/register')
  } else {
    console.log('❌ Database verification FAILED')
    console.log('')
    console.log('Required actions:')
    console.log('   1. Run database setup: pnpm tsx scripts/setup-database.ts')
    console.log('   2. Verify DATABASE_URL is set correctly')
    console.log('   3. Check database server is running')
  }
  console.log('===================================================')

  // Exit with appropriate code
  process.exit(critical.length > 0 ? 1 : 0)
}

/**
 * Main verification function
 */
async function verifyDatabase(): Promise<void> {
  try {
    await checkConnection()
    await verifySchemas()
    await verifyMigrations()
    await verifyTables()
    await verifyApiEndpoints()
    generateSummary()
  } catch (error: any) {
    console.error('\n❌ Verification failed with error:', error)
    process.exit(1)
  }
}

// Run verification
verifyDatabase()

export { verifyDatabase }
