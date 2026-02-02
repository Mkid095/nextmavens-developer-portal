/**
 * Auth Service Snapshot Client
 * @deprecated Re-exports from snapshot-client module for backward compatibility
 * Import from './snapshot-client' instead
 *
 * Client library for the auth service to consume control plane snapshots.
 */

export * from './snapshot-client/types'
export { AuthServiceSnapshotClient, cleanupExpiredCacheEntries } from './snapshot-client/client'
export {
  authServiceSnapshotClient,
  canPerformAuthOperation,
  isProjectActive,
  isAuthServiceEnabled,
  invalidateSnapshotCache,
  clearSnapshotCache,
  getSnapshotCacheStats,
} from './snapshot-client/convenience'
