/**
 * Usage Tracking Module
 *
 * Exports all usage tracking functionality for database, storage, auth, and other services.
 *
 * US-002, US-004, US-005, US-009 from prd-usage-tracking.json
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
  recordAuthMetric,
  recordAuthMetrics,
  trackAuthSignup,
  trackAuthSignin,
  getAuthUsageStats,
  getCurrentAuthUsage,
  type AuthMetricType,
  type AuthUsageMetric,
} from './auth-tracking'

export {
  getSampleRate,
  getConfiguredSampleRate,
  shouldTrackUsage,
  getExtrapolationMultiplier,
  adjustQuantityForSampling,
  isSamplingEnabled,
  getSamplingInfo,
  trackWithSampling,
  trackWithExtrapolation,
} from './sampling'

export {
  withUsageTracking,
  withUsageTrackingCustom,
  type UsageTrackingOptions,
} from './usage-middleware'
