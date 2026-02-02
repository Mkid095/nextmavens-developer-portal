/**
 * Storage Service Snapshot Client
 *
 * Client library for the storage service to consume control plane snapshots.
 * US-008: Update Storage Service to Consume Snapshot
 * US-007: Add Correlation ID to Storage Service
 */

export {
  storageServiceSnapshotClient,
  validateStorageOperation,
  canPerformStorageOperation,
  isStorageProjectActive,
  isStorageServiceEnabled,
  isStorageServiceEnabledFn,
  getStorageUploadQuota,
  getStorageQuotas,
  getStorageRateLimits,
  getStorageProjectEnvironment,
  invalidateStorageSnapshotCache,
  clearStorageSnapshotCache,
  getStorageSnapshotCacheStats,
  cleanupExpiredStorageCacheEntries,
  setStorageCorrelationId,
  getStorageCorrelationId,
  clearStorageContext,
} from './snapshot-client/convenience'

if (typeof setInterval !== 'undefined') {
  const { cleanupExpiredStorageCacheEntries } = require('./snapshot-client/convenience')
  setInterval(() => {
    cleanupExpiredStorageCacheEntries()
  }, 5 * 60 * 1000)
}
