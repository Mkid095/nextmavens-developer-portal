/**
 * Usage Tracking Module
 *
 * Exports all usage tracking functionality for database, storage, and other services.
 *
 * US-002, US-004 from prd-usage-tracking.json
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
  recordStorageMetric,
  recordStorageMetrics,
  trackStorageUpload,
  trackStorageDownload,
  getStorageUsageStats,
  getCurrentStorageUsage,
  type StorageMetricType,
  type StorageUsageMetric,
} from './storage-tracking'

export {
  withUsageTracking,
  withUsageTrackingCustom,
  type UsageTrackingOptions,
} from './usage-middleware'
