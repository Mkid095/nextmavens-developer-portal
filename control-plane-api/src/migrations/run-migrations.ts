/**
 * Migration runner script for Control Plane API
 *
 * This script runs all pending migrations for the control_plane schema
 * and new features: usage tracking, jobs, audit logs, and webhooks.
 */

import { getPool } from '@/lib/db'
import { createOrganizationsTables } from '@/features/organizations/migrations/create-organizations-table'
import { createUsageMetricsTable } from '@/features/usage-tracking/migrations/create-usage-metrics-table'
import { createJobsTable } from '@/features/jobs/migrations/create-jobs-table'
import { createAuditLogsTable } from '@/features/audit/migrations/create-audit-logs-table'
import { createWebhooksTables } from '@/features/webhooks/migrations/create-webhooks-table'

async function runMigrations() {
  const pool = getPool()

  try {
    console.log('='.repeat(60))
    console.log('Starting Control Plane API migrations...')
    console.log('='.repeat(60))

    // Run organization tables migration
    console.log('\n[1/5] Creating organizations and organization_members tables...')
    const orgResult = await createOrganizationsTables()
    if (!orgResult.success) {
      console.error('❌ Failed to create organization tables:', orgResult.error)
      process.exit(1)
    }
    console.log('✅ Organization tables migration completed')

    // Run usage metrics table migration
    console.log('\n[2/5] Creating usage_metrics table...')
    const usageResult = await createUsageMetricsTable()
    if (!usageResult.success) {
      console.error('❌ Failed to create usage metrics table:', usageResult.error)
      process.exit(1)
    }
    console.log('✅ Usage metrics table migration completed')

    // Run jobs table migration
    console.log('\n[3/5] Creating jobs table...')
    const jobsResult = await createJobsTable()
    if (!jobsResult.success) {
      console.error('❌ Failed to create jobs table:', jobsResult.error)
      process.exit(1)
    }
    console.log('✅ Jobs table migration completed')

    // Run audit logs table migration
    console.log('\n[4/5] Creating audit_logs table...')
    const auditResult = await createAuditLogsTable()
    if (!auditResult.success) {
      console.error('❌ Failed to create audit logs table:', auditResult.error)
      process.exit(1)
    }
    console.log('✅ Audit logs table migration completed')

    // Run webhooks tables migration
    console.log('\n[5/5] Creating webhooks and event_logs tables...')
    const webhooksResult = await createWebhooksTables()
    if (!webhooksResult.success) {
      console.error('❌ Failed to create webhooks tables:', webhooksResult.error)
      process.exit(1)
    }
    console.log('✅ Webhooks tables migration completed')

    console.log('\n' + '='.repeat(60))
    console.log('✅ All migrations completed successfully!')
    console.log('='.repeat(60))

    // Display summary
    console.log('\n📊 Migration Summary:')
    console.log('  - Organizations & Members: ✅')
    console.log('  - Usage Metrics: ✅')
    console.log('  - Background Jobs: ✅')
    console.log('  - Audit Logs: ✅')
    console.log('  - Webhooks & Event Logs: ✅')

    console.log('\n🎉 Control Plane API is ready!')

    process.exit(0)
  } catch (error) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ Migration failed with error:')
    console.error('='.repeat(60))
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
}

export { runMigrations }
