/**
 * Usage Tracking Module
 *
 * Exports all usage tracking functionality for database and other services.
 *
 * US-002 from prd-usage-tracking.json
 */

export {
  recordDatabaseMetric,
  recordDatabaseMetrics,
  trackDatabaseQuery,
  getDatabaseUsageStats,
  getCurrentDatabaseUsage,
  type DatabaseMetricType,
  type DatabaseUsageMetric,
} from './database-tracking'

export {
  withUsageTracking,
  withUsageTrackingCustom,
  type UsageTrackingOptions,
} from './usage-middleware'
