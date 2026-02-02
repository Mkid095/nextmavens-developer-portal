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
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import type {
  SnapshotClientConfig,
  SnapshotFetchResult,
  ConnectionValidationResult,
} from './snapshot-client/types'
import { DEFAULT_CONFIG } from './snapshot-client/config'
import {
  getCachedSnapshot,
  setCachedSnapshot,
  isCacheValid,
  deleteCachedSnapshot,
  invalidateSnapshotCache,
  clearSnapshotCache as clearAllSnapshotCache,
  getSnapshotCacheSize,
  getSnapshotEntries,
  cleanupExpiredCacheEntries,
} from './snapshot-client/cache'
import {
  getActiveConnectionCount,
  incrementConnectionCount as incrementConn,
  decrementConnectionCount as decrementConn,
  resetConnectionCount,
  clearAllConnectionCounts,
  getActiveConnections,
  getConnectionTrackingEntries,
} from './snapshot-client/connection-tracker'
import {
  isProjectActive,
  isRealtimeServiceEnabled,
  validateConnection as validateSnapshotConnection,
} from './snapshot-client/validation'
import { setRequestCorrelationId, getRequestCorrelationId, formatLogMessage } from './request-context'

/**
 * Realtime Service Snapshot Client
 *
 * Provides methods to fetch and consume control plane snapshots
 * with local caching, connection tracking, and fail-closed behavior.
 */
export class RealtimeServiceSnapshotClient {
  private config: SnapshotClientConfig

  constructor(config: Partial<SnapshotClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Set the correlation ID for this client instance
   * US-006: Correlation ID tracking
   * @param correlationId - The correlation ID to set
   */
  setCorrelationId(correlationId: string): void {
    setRequestCorrelationId(correlationId)
  }

  /**
   * Get the current correlation ID
   * US-006: Correlation ID tracking
   * @returns The correlation ID or undefined
   */
  getCorrelationId(): string | undefined {
    return getRequestCorrelationId()
  }

  /**
   * Fetch a snapshot from the control plane
   * @param projectId - Project ID to fetch snapshot for
   * @returns Snapshot fetch result
   */
  async fetchSnapshot(projectId: string): Promise<SnapshotFetchResult> {
    try {
      const url = `${this.config.controlPlaneUrl}/api/internal/snapshot?project_id=${projectId}`
      const correlationId = getRequestCorrelationId()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // US-006: Add x-request-id header for correlation
      if (correlationId) {
        headers['x-request-id'] = correlationId
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 503) {
          console.error(formatLogMessage('Control plane unavailable (503)'))
          return {
            success: false,
            error: 'Control plane unavailable',
          }
        }

        if (response.status === 404) {
          console.error(formatLogMessage(`Project not found: ${projectId}`))
          return {
            success: false,
            error: 'Project not found',
          }
        }

        console.error(formatLogMessage(`Unexpected response: ${response.status}`))
        return {
          success: false,
          error: `Unexpected response: ${response.status}`,
        }
      }

      const data = await response.json()

      if (!data.snapshot) {
        console.error(formatLogMessage('No snapshot in response'))
        return {
          success: false,
          error: 'Invalid response format',
        }
      }

      return {
        success: true,
        snapshot: data.snapshot as ControlPlaneSnapshot,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(formatLogMessage('Request timeout'))
        return {
          success: false,
          error: 'Request timeout',
        }
      }

      console.error(formatLogMessage('Fetch error:'), error)
      return {
        success: false,
        error: 'Failed to fetch snapshot',
      }
    }
  }

  /**
   * Get a snapshot from cache or fetch from control plane
   * @param projectId - Project ID to get snapshot for
   * @returns Snapshot or null if unavailable
   */
  async getSnapshot(projectId: string): Promise<ControlPlaneSnapshot | null> {
    const now = Date.now()

    // Check cache first
    const cached = getCachedSnapshot(projectId)
    if (cached && isCacheValid(cached)) {
      return cached.snapshot
    }

    // Fetch from control plane
    const result = await this.fetchSnapshot(projectId)

    if (!result.success || !result.snapshot) {
      // Fail closed - remove from cache if exists
      deleteCachedSnapshot(projectId)
      console.error(formatLogMessage(`Snapshot unavailable for project ${projectId}`))
      return null
    }

    // Compare versions if we have a cached entry
    if (cached) {
      if (cached.snapshot.version !== result.snapshot.version) {
        console.log(
          formatLogMessage(`Version changed for project ${projectId}: ${cached.snapshot.version} -> ${result.snapshot.version}`)
        )
      }
    }

    // Cache the snapshot with version tracking
    setCachedSnapshot(projectId, {
      snapshot: result.snapshot,
      expiresAt: now + this.config.cacheTTL,
      version: result.snapshot.version,
    })

    return result.snapshot
  }

  /**
   * Check if a project is active
   * @param projectId - Project ID to check
   * @returns true if project is active, false otherwise (fail-closed)
   */
  async isProjectActive(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)
    return isProjectActive(snapshot, formatLogMessage, projectId)
  }

  /**
   * Check if realtime service is enabled for a project
   * @param projectId - Project ID to check
   * @returns true if realtime service is enabled, false otherwise (fail-closed)
   */
  async isRealtimeServiceEnabled(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)
    return isRealtimeServiceEnabled(snapshot, formatLogMessage, projectId)
  }

  /**
   * Get the connection limit for a project
   * @param projectId - Project ID
   * @returns Connection limit or null
   */
  async getConnectionLimit(projectId: string): Promise<number | null> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      return null
    }

    return snapshot.quotas.realtime_connections
  }

  /**
   * Get current active connection count for a project
   * @param projectId - Project ID
   * @returns Current connection count
   */
  getActiveConnectionCount(projectId: string): number {
    return getActiveConnectionCount(projectId)
  }

  /**
   * Increment active connection count for a project
   * Called when a new WebSocket connection is established
   * @param projectId - Project ID
   * @returns New connection count
   */
  incrementConnectionCount(projectId: string): number {
    return incrementConn(projectId, formatLogMessage)
  }

  /**
   * Decrement active connection count for a project
   * Called when a WebSocket connection is closed
   * @param projectId - Project ID
   * @returns New connection count
   */
  decrementConnectionCount(projectId: string): number {
    return decrementConn(projectId, formatLogMessage)
  }

  /**
   * Validate if a WebSocket connection should be allowed
   * This is the main method to call before accepting a WebSocket connection
   * @param projectId - Project ID to validate
   * @returns Connection validation result with allowed flag and optional reason
   */
  async validateConnection(projectId: string): Promise<ConnectionValidationResult> {
    const snapshot = await this.getSnapshot(projectId)
    const currentCount = this.getActiveConnectionCount(projectId)
    const limit = await this.getConnectionLimit(projectId)

    return validateSnapshotConnection(snapshot, formatLogMessage, projectId, currentCount, limit)
  }

  /**
   * Check if a WebSocket connection can be established
   * Convenience method that returns boolean for simple checks
   * @param projectId - Project ID to check
   * @returns true if connection should be allowed, false otherwise (fail-closed)
   */
  async canAcceptConnection(projectId: string): Promise<boolean> {
    const result = await this.validateConnection(projectId)
    return result.allowed
  }

  /**
   * Get rate limit configuration for a project
   * @param projectId - Project ID
   * @returns Rate limit configuration or null
   */
  async getRateLimits(projectId: string): Promise<ControlPlaneSnapshot['limits'] | null> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      return null
    }

    return snapshot.limits
  }

  /**
   * Get quota configuration for a project
   * @param projectId - Project ID
   * @returns Quota configuration or null
   */
  async getQuotas(projectId: string): Promise<ControlPlaneSnapshot['quotas'] | null> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      return null
    }

    return snapshot.quotas
  }

  /**
   * Get project environment
   * @param projectId - Project ID
   * @returns Project environment or null
   */
  async getProjectEnvironment(projectId: string): Promise<string | null> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      return null
    }

    return snapshot.project.environment
  }

  /**
   * Invalidate cached snapshot for a project
   * @param projectId - Project ID to invalidate cache for
   */
  invalidateCache(projectId: string): void {
    invalidateSnapshotCache(projectId)
    console.log(formatLogMessage(`Invalidated cache for project ${projectId}`))
  }

  /**
   * Clear all cached snapshots
   */
  clearCache(): void {
    clearAllSnapshotCache()
    console.log(formatLogMessage('Cleared all cache'))
  }

  /**
   * Reset connection count for a project
   * @param projectId - Project ID
   */
  resetConnectionCount(projectId: string): void {
    resetConnectionCount(projectId, formatLogMessage)
  }

  /**
   * Clear all connection counts
   */
  clearAllConnectionCounts(): void {
    clearAllConnectionCounts(formatLogMessage)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    snapshotCacheSize: number
    connectionTrackingEntries: number
    snapshotEntries: Array<{ projectId: string; expiresAt: Date }>
    activeConnections: Array<{ projectId: string; count: number }>
  } {
    return {
      snapshotCacheSize: getSnapshotCacheSize(),
      connectionTrackingEntries: getConnectionTrackingEntries(),
      snapshotEntries: getSnapshotEntries(),
      activeConnections: getActiveConnections(),
    }
  }
}

/**
 * Default singleton instance of the snapshot client
 */
export const realtimeServiceSnapshotClient = new RealtimeServiceSnapshotClient()

/**
 * Cleanup expired cache entries periodically
 * Re-exports from cache module for convenience
 */
export function cleanupExpiredCacheEntriesPeriodically(): number {
  return cleanupExpiredCacheEntries()
}

// Start periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredCacheEntries()
  }, 5 * 60 * 1000)
}
