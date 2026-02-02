/**
 * Realtime Service Snapshot Client Types
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
 * Realtime connection validation result
 */
export interface ConnectionValidationResult {
  allowed: boolean
  reason?: string
  retryAfter?: number // seconds
}
