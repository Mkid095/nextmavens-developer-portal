/**
 * Run the spike detection migrations
 *
 * This script creates all tables needed for the usage spike detection system:
 * - usage_metrics: Stores historical usage data
 * - spike_detection_config: Stores per-project spike detection configuration
 * - spike_detections: Logs detected spikes for audit and analysis
 */

import { createUsageMetricsTable } from '../src/features/abuse-controls/migrations/create-usage-metrics-table'
import { createSpikeDetectionConfigTable } from '../src/features/abuse-controls/migrations/create-spike-detection-config-table'
import { createSpikeDetectionsTable } from '../src/features/abuse-controls/migrations/create-spike-detections-table'

async function main() {
  console.log('=================================')
  console.log('Running Spike Detection Migrations')
  console.log('=================================\n')

  // Create usage_metrics table
  console.log('1. Creating usage_metrics table...')
  const usageMetricsResult = await createUsageMetricsTable()
  if (usageMetricsResult.success) {
    console.log('✓ usage_metrics table migration completed\n')
  } else {
    console.error('✗ usage_metrics table migration failed:', usageMetricsResult.error)
    process.exit(1)
  }

  // Create spike_detection_config table
  console.log('2. Creating spike_detection_config table...')
  const configResult = await createSpikeDetectionConfigTable()
  if (configResult.success) {
    console.log('✓ spike_detection_config table migration completed\n')
  } else {
    console.error('✗ spike_detection_config table migration failed:', configResult.error)
    process.exit(1)
  }

  // Create spike_detections table
  console.log('3. Creating spike_detections table...')
  const detectionsResult = await createSpikeDetectionsTable()
  if (detectionsResult.success) {
    console.log('✓ spike_detections table migration completed\n')
  } else {
    console.error('✗ spike_detections table migration failed:', detectionsResult.error)
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
