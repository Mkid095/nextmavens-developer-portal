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

import { ControlPlaneSnapshot, ProjectStatus } from '@/lib/snapshot/types'

/**
 * Request context for tracking correlation ID per connection
 * US-006: Correlation ID tracking
 */
interface RequestContext {
  correlationId?: string
}

/**
 * Current request context (tracked per WebSocket connection)
 * US-006: Correlation ID tracking
 */
let currentRequestContext: RequestContext = {}

/**
 * Set the correlation ID for the current request context
 * US-006: Correlation ID tracking
 * @param correlationId - The correlation ID to set
 */
export function setRequestCorrelationId(correlationId: string): void {
  currentRequestContext.correlationId = correlationId
}

/**
 * Get the correlation ID from the current request context
 * US-006: Correlation ID tracking
 * @returns The correlation ID or undefined
 */
export function getRequestCorrelationId(): string | undefined {
  return currentRequestContext.correlationId
}

/**
 * Clear the current request context
 * US-006: Correlation ID tracking
 */
export function clearRequestContext(): void {
  currentRequestContext = {}
}

/**
 * Format a log message with correlation ID
 * US-006: Correlation ID tracking
 * @param message - The message to format
 * @returns Formatted message with correlation ID if available
 */
export function formatLogMessage(message: string): string {
  const correlationId = getRequestCorrelationId()
  if (correlationId) {
    return `[Realtime Service Snapshot] [correlation_id: ${correlationId}] ${message}`
  }
  return `[Realtime Service Snapshot] ${message}`
}

/**
 * Configuration for the snapshot client
 */
interface SnapshotClientConfig {
  controlPlaneUrl: string
  cacheTTL: number // milliseconds
  requestTimeout: number // milliseconds
}

/**
 * Snapshot cache entry with version tracking
 */
interface CachedSnapshot {
  snapshot: ControlPlaneSnapshot
  expiresAt: number
  version: string
}

/**
 * Result of a snapshot fetch operation
 */
interface SnapshotFetchResult {
  success: boolean
  snapshot?: ControlPlaneSnapshot
  error?: string
}

/**
 * Realtime connection validation result
 */
interface ConnectionValidationResult {
  allowed: boolean
  reason?: string
  retryAfter?: number // seconds
}

/**
 * Active connections tracker per project
 * Key: project_id, Value: number of active connections
 */
const activeConnections = new Map<string, number>()

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SnapshotClientConfig = {
  controlPlaneUrl: process.env.CONTROL_PLANE_URL || 'http://localhost:3000',
  cacheTTL: 30 * 1000, // 30 seconds
  requestTimeout: 5000, // 5 seconds
}

/**
 * In-memory snapshot cache
 * Key: project_id, Value: cached snapshot
 */
const snapshotCache = new Map<string, CachedSnapshot>()

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
   * Compares versions to detect stale cached data
   * @param projectId - Project ID to get snapshot for
   * @returns Snapshot or null if unavailable
   */
  async getSnapshot(projectId: string): Promise<ControlPlaneSnapshot | null> {
    const now = Date.now()

    // Check cache first
    const cached = snapshotCache.get(projectId)
    if (cached && cached.expiresAt > now) {
      return cached.snapshot
    }

    // Fetch from control plane
    const result = await this.fetchSnapshot(projectId)

    if (!result.success || !result.snapshot) {
      // Fail closed - remove from cache if exists
      snapshotCache.delete(projectId)
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
    snapshotCache.set(projectId, {
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

    if (!snapshot) {
      // Fail closed - deny if snapshot unavailable
      console.error(formatLogMessage(`Snapshot unavailable for project ${projectId}`))
      return false
    }

    const isActive = snapshot.project.status === 'active'

    if (!isActive) {
      console.log(formatLogMessage(`Project ${projectId} is not active: ${snapshot.project.status}`))
    }

    return isActive
  }

  /**
   * Check if realtime service is enabled for a project
   * @param projectId - Project ID to check
   * @returns true if realtime service is enabled, false otherwise (fail-closed)
   */
  async isRealtimeServiceEnabled(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      // Fail closed - deny if snapshot unavailable
      console.error(formatLogMessage(`Snapshot unavailable for project ${projectId}`))
      return false
    }

    const isEnabled = snapshot.services.realtime?.enabled ?? false

    if (!isEnabled) {
      console.log(formatLogMessage(`Realtime service not enabled for project ${projectId}`))
    }

    return isEnabled
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
    return activeConnections.get(projectId) || 0
  }

  /**
   * Increment active connection count for a project
   * Called when a new WebSocket connection is established
   * @param projectId - Project ID
   * @returns New connection count
   */
  incrementConnectionCount(projectId: string): number {
    const current = activeConnections.get(projectId) || 0
    const newCount = current + 1
    activeConnections.set(projectId, newCount)
    console.log(formatLogMessage(`Connection count for project ${projectId}: ${newCount}`))
    return newCount
  }

  /**
   * Decrement active connection count for a project
   * Called when a WebSocket connection is closed
   * @param projectId - Project ID
   * @returns New connection count
   */
  decrementConnectionCount(projectId: string): number {
    const current = activeConnections.get(projectId) || 0
    const newCount = Math.max(0, current - 1)
    activeConnections.set(projectId, newCount)
    console.log(formatLogMessage(`Connection count for project ${projectId}: ${newCount}`))
    return newCount
  }

  /**
   * Validate if a WebSocket connection should be allowed
   * This is the main method to call before accepting a WebSocket connection
   *
   * Checks:
   * - Project status (must be ACTIVE)
   * - Realtime service enablement (must be enabled)
   * - Connection limit (must not exceed quota)
   *
   * @param projectId - Project ID to validate
   * @returns Connection validation result with allowed flag and optional reason
   */
  async validateConnection(projectId: string): Promise<ConnectionValidationResult> {
    // Check project status
    const isActive = await this.isProjectActive(projectId)
    if (!isActive) {
      const snapshot = await this.getSnapshot(projectId)
      const status = snapshot?.project.status || 'unknown'

      let reason: string
      switch (status) {
        case 'suspended':
          reason = 'PROJECT_SUSPENDED'
          break
        case 'archived':
          reason = 'PROJECT_ARCHIVED'
          break
        case 'deleted':
          reason = 'PROJECT_DELETED'
          break
        default:
          reason = 'PROJECT_NOT_ACTIVE'
      }

      return {
        allowed: false,
        reason,
      }
    }

    // Check realtime service enablement
    const isEnabled = await this.isRealtimeServiceEnabled(projectId)
    if (!isEnabled) {
      return {
        allowed: false,
        reason: 'REALTIME_SERVICE_DISABLED',
      }
    }

    // Check connection limit
    const limit = await this.getConnectionLimit(projectId)
    const currentCount = this.getActiveConnectionCount(projectId)

    if (limit !== null && currentCount >= limit) {
      console.log(formatLogMessage(`Connection limit exceeded for project ${projectId}: ${currentCount}/${limit}`))
      return {
        allowed: false,
        reason: 'CONNECTION_LIMIT_EXCEEDED',
        retryAfter: 60, // Suggest retry after 1 minute
      }
    }

    return {
      allowed: true,
    }
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
   * Call this when you know project state has changed
   * @param projectId - Project ID to invalidate cache for
   */
  invalidateCache(projectId: string): void {
    snapshotCache.delete(projectId)
    console.log(formatLogMessage(`Invalidated cache for project ${projectId}`))
  }

  /**
   * Clear all cached snapshots
   */
  clearCache(): void {
    snapshotCache.clear()
    console.log('[Realtime Service Snapshot] Cleared all cache')
  }

  /**
   * Reset connection count for a project
   * Call this when you need to reset tracking (e.g., after service restart)
   * @param projectId - Project ID
   */
  resetConnectionCount(projectId: string): void {
    activeConnections.delete(projectId)
    console.log(`[Realtime Service Snapshot] Reset connection count for project ${projectId}`)
  }

  /**
   * Clear all connection counts
   */
  clearAllConnectionCounts(): void {
    activeConnections.clear()
    console.log('[Realtime Service Snapshot] Cleared all connection counts')
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
      snapshotCacheSize: snapshotCache.size,
      connectionTrackingEntries: activeConnections.size,
      snapshotEntries: Array.from(snapshotCache.entries()).map(([projectId, cached]) => ({
        projectId,
        expiresAt: new Date(cached.expiresAt),
      })),
      activeConnections: Array.from(activeConnections.entries()).map(([projectId, count]) => ({
        projectId,
        count,
      })),
    }
  }
}

/**
 * Default singleton instance of the snapshot client
 */
export const realtimeServiceSnapshotClient = new RealtimeServiceSnapshotClient()

/**
 * Convenience functions using the default client
 */

/**
 * Validate if a WebSocket connection should be allowed
 * @param projectId - Project ID to check
 * @returns Connection validation result with allowed flag and optional reason
 */
export async function validateRealtimeConnection(
  projectId: string
): Promise<ConnectionValidationResult> {
  return realtimeServiceSnapshotClient.validateConnection(projectId)
}

/**
 * Check if a WebSocket connection can be established
 * @param projectId - Project ID to check
 * @returns true if connection should be allowed
 */
export async function canAcceptConnection(projectId: string): Promise<boolean> {
  return realtimeServiceSnapshotClient.canAcceptConnection(projectId)
}

/**
 * Check if a project is active
 * @param projectId - Project ID to check
 * @returns true if project is active
 */
export async function isRealtimeProjectActive(projectId: string): Promise<boolean> {
  return realtimeServiceSnapshotClient.isProjectActive(projectId)
}

/**
 * Check if realtime service is enabled for a project
 * @param projectId - Project ID to check
 * @returns true if realtime service is enabled
 */
export async function isRealtimeServiceEnabled(projectId: string): Promise<boolean> {
  return realtimeServiceSnapshotClient.isRealtimeServiceEnabled(projectId)
}

/**
 * Get the connection limit for a project
 * @param projectId - Project ID
 * @returns Connection limit or null
 */
export async function getRealtimeConnectionLimit(projectId: string): Promise<number | null> {
  return realtimeServiceSnapshotClient.getConnectionLimit(projectId)
}

/**
 * Get current active connection count for a project
 * @param projectId - Project ID
 * @returns Current connection count
 */
export function getActiveConnectionCount(projectId: string): number {
  return realtimeServiceSnapshotClient.getActiveConnectionCount(projectId)
}

/**
 * Increment active connection count for a project
 * @param projectId - Project ID
 * @returns New connection count
 */
export function incrementConnectionCount(projectId: string): number {
  return realtimeServiceSnapshotClient.incrementConnectionCount(projectId)
}

/**
 * Decrement active connection count for a project
 * @param projectId - Project ID
 * @returns New connection count
 */
export function decrementConnectionCount(projectId: string): number {
  return realtimeServiceSnapshotClient.decrementConnectionCount(projectId)
}

/**
 * Get rate limit configuration for a project
 * @param projectId - Project ID
 * @returns Rate limit configuration or null
 */
export async function getRealtimeRateLimits(
  projectId: string
): Promise<ControlPlaneSnapshot['limits'] | null> {
  return realtimeServiceSnapshotClient.getRateLimits(projectId)
}

/**
 * Get quota configuration for a project
 * @param projectId - Project ID
 * @returns Quota configuration or null
 */
export async function getRealtimeQuotas(
  projectId: string
): Promise<ControlPlaneSnapshot['quotas'] | null> {
  return realtimeServiceSnapshotClient.getQuotas(projectId)
}

/**
 * Get project environment
 * @param projectId - Project ID
 * @returns Project environment or null
 */
export async function getRealtimeProjectEnvironment(projectId: string): Promise<string | null> {
  return realtimeServiceSnapshotClient.getProjectEnvironment(projectId)
}

/**
 * Invalidate cached snapshot for a project
 * @param projectId - Project ID to invalidate
 */
export function invalidateRealtimeSnapshotCache(projectId: string): void {
  realtimeServiceSnapshotClient.invalidateCache(projectId)
}

/**
 * Clear all cached snapshots
 */
export function clearRealtimeSnapshotCache(): void {
  realtimeServiceSnapshotClient.clearCache()
}

/**
 * Reset connection count for a project
 * @param projectId - Project ID
 */
export function resetRealtimeConnectionCount(projectId: string): void {
  realtimeServiceSnapshotClient.resetConnectionCount(projectId)
}

/**
 * Clear all connection counts
 */
export function clearAllConnectionCounts(): void {
  realtimeServiceSnapshotClient.clearAllConnectionCounts()
}

/**
 * Get cache statistics
 */
export function getRealtimeSnapshotCacheStats(): {
  snapshotCacheSize: number
  connectionTrackingEntries: number
  snapshotEntries: Array<{ projectId: string; expiresAt: Date }>
  activeConnections: Array<{ projectId: string; count: number }>
} {
  return realtimeServiceSnapshotClient.getCacheStats()
}

/**
 * Clean up expired cache entries
 * Call this periodically to remove stale entries
 */
export function cleanupExpiredRealtimeCacheEntries(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [projectId, cached] of snapshotCache.entries()) {
    if (cached.expiresAt < now) {
      snapshotCache.delete(projectId)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[Realtime Service Snapshot] Cleaned up ${cleaned} expired cache entries`)
  }

  return cleaned
}

// Start periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredRealtimeCacheEntries()
  }, 5 * 60 * 1000)
}
