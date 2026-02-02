/**
 * Storage Service Snapshot Client Types
 *
 * Type definitions for the storage service snapshot client.
 */

import { ControlPlaneSnapshot } from '@/lib/snapshot/types'

/**
 * Request context for correlation ID tracking
 */
export interface RequestContext {
  correlationId?: string
}

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
 * Storage operation result
 */
export interface StorageOperationResult {
  allowed: boolean
  reason?: string
  quota?: number
  remaining?: number
}
