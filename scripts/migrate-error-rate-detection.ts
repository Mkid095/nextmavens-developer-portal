/**
 * Run the error rate detection migrations
 *
 * This script creates all tables needed for the error rate detection system:
 * - error_metrics: Stores error metrics for projects
 */

import { createErrorMetricsTable } from '../src/features/abuse-controls/migrations/create-error-metrics-table'

async function main() {
  console.log('=================================')
  console.log('Running Error Rate Detection Migrations')
  console.log('=================================\n')

  // Create error_metrics table
  console.log('1. Creating error_metrics table...')
  const errorMetricsResult = await createErrorMetricsTable()
  if (errorMetricsResult.success) {
    console.log('✓ error_metrics table migration completed\n')
  } else {
    console.error('✗ error_metrics table migration failed:', errorMetricsResult.error)
    process.exit(1)
  }

  console.log('=================================')
  console.log('All migrations completed successfully!')
  console.log('=================================')
  process.exit(0)
}

main().catch(error => {
  console.error('Migration error:', error)
  process.exit(1)
})
