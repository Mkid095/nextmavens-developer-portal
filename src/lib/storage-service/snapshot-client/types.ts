/**
 * Storage Service Snapshot Client Types
 * Type definitions for snapshot client
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'

/**
 * Configuration for the snapshot client
 */
export interface SnapshotClientConfig {
  controlPlaneUrl: string
  cacheTTL: number // milliseconds
  requestTimeout: number // milliseconds
}

/**
 * Request context for correlation ID tracking
 */
export interface RequestContext {
  correlationId?: string
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
