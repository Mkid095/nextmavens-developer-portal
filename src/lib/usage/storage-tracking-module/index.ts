/**
 * Storage Usage Tracking - Module - Index
 *
 * @deprecated This file has been refactored into the storage-tracking-module.
 * Please import from './storage-tracking-module' instead.
 */

export * from './types'
export * from './constants'
export * from './validators'
export * from './db-operations'
export * from './recording'
export * from './queries'

// Re-export all functions for backward compatibility
export {
  recordStorageMetric,
  recordStorageMetrics,
  trackStorageUpload,
  trackStorageDownload,
  getStorageUsageStats,
  getCurrentStorageUsage,
} from './recording'

export { getStorageUsageStats, getCurrentStorageUsage } from './queries'
