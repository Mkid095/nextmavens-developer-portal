/**
 * Auth Service Snapshot Client - Type Definitions
 *
 * Client library for the auth service to consume control plane snapshots.
 * SNAPSHOTS ARE CACHED LOCALLY with TTL to reduce control plane load.
 *
 * FAIL-CLOSED BEHAVIOR:
 * - All operations return false (deny) when snapshot is unavailable
 * - Auth operations are blocked when control plane is down
 */

import { ControlPlaneSnapshot } from '@/lib/snapshot/types'

/**
 * Configuration for the snapshot client
 */
export interface SnapshotClientConfig {
  controlPlaneUrl: string
  cacheTTL: number // milliseconds
  requestTimeout: number // milliseconds
}

/**
 * Snapshot cache entry with version tracking
 */
export interface CachedSnapshot {
  snapshot: ControlPlaneSnapshot
  expiresAt: number
  version: string
}

/**
 * Result of a snapshot fetch operation
 */
export interface SnapshotFetchResult {
  success: boolean
  snapshot?: ControlPlaneSnapshot
  error?: string
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number
  entries: Array<{ projectId: string; expiresAt: Date }>
}
