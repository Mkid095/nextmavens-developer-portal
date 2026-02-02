/**
 * Auth Service Snapshot Client Module
 *
 * Client library for the auth service to consume control plane snapshots.
 * This allows the auth service to check project status and service enablement
 * without hitting the control database directly.
 *
 * SNAPSHOTS ARE CACHED LOCALLY with TTL to reduce control plane load.
 *
 * FAIL-CLOSED BEHAVIOR:
 * - All operations return false (deny) when snapshot is unavailable
 * - Auth operations are blocked when control plane is down
 * - This ensures security is never compromised
 */

export * from './types'
export { AuthServiceSnapshotClient, cleanupExpiredCacheEntries } from './client'
export {
  authServiceSnapshotClient,
  canPerformAuthOperation,
  isProjectActive,
  isAuthServiceEnabled,
  invalidateSnapshotCache,
  clearSnapshotCache,
  getSnapshotCacheStats,
} from './convenience'
