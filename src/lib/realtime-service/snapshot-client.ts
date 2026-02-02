/**
 * Realtime Service Snapshot Client
 *
 * Client library for the realtime service to consume control plane snapshots.
 * This allows the realtime service to validate project status and enforce
 * connection limits before accepting WebSocket connections without hitting
 * the control database directly.
 *
 * SNAPSHOTS ARE CACHED LOCALLY with TTL to reduce control plane load.
 *
 * FAIL-CLOSED BEHAVIOR:
 * - All operations return false (deny) when snapshot is unavailable
 * - WebSocket connections are blocked when control plane is down
 * - This ensures security is never compromised
 *
 * US-007: Update Realtime Service to Consume Snapshot
 * US-006: Add Correlation ID to Realtime Service
 *
 * @module snapshot-client
 */

// Re-export all types, classes, and functions for the snapshot client
export {
  // Client class
  RealtimeServiceSnapshotClient,

  // Request context
  setRequestCorrelationId,
  getRequestCorrelationId,
  clearRequestContext,
  formatLogMessage,

  // Convenience functions using default client
  realtimeServiceSnapshotClient,
  validateRealtimeConnection,
  canAcceptConnection,
  isRealtimeProjectActive,
  isRealtimeServiceEnabled,
  isRealtimeServiceEnabledFn,
  getRealtimeConnectionLimit,
  getActiveConnectionCountFn,
  incrementConnectionCountFn,
  decrementConnectionCountFn,
  getRealtimeRateLimits,
  getRealtimeQuotas,
  getRealtimeProjectEnvironment,
  invalidateRealtimeSnapshotCache,
  clearRealtimeSnapshotCache,
  resetRealtimeConnectionCount,
  clearAllConnectionCountsFn,
  getRealtimeSnapshotCacheStats,
  cleanupExpiredRealtimeCacheEntries,
} from './snapshot-client/convenience'

// Start periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  const { cleanupExpiredRealtimeCacheEntries } = require('./snapshot-client/convenience')
  setInterval(() => {
    cleanupExpiredRealtimeCacheEntries()
  }, 5 * 60 * 1000)
}
