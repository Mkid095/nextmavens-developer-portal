/**
 * API Gateway Snapshot Client
 *
 * Client library for the API gateway to consume control plane snapshots.
 * This allows the API gateway to enforce governance rules without hitting
 * the control database directly.
 *
 * SNAPSHOTS ARE CACHED LOCALLY with TTL to reduce control plane load.
 *
 * FAIL-CLOSED BEHAVIOR:
 * - All operations return deny (false/error) when snapshot is unavailable
 * - Requests are blocked when control plane is down
 * - This ensures security is never compromised
 */

import { ControlPlaneSnapshot, ProjectStatus } from '@/lib/snapshot/types'
import { getEnvironmentConfig, mapSnapshotEnvironment } from '@/lib/environment'

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
 * Rate limit check result
 */
interface RateLimitCheckResult {
  allowed: boolean
  reason?: string
  retryAfter?: number // seconds
}

/**
 * Gateway service types
 */
type GatewayService = 'auth' | 'graphql' | 'realtime' | 'storage' | 'database' | 'functions'

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
 * Sliding window rate limit tracker
 * Key: project_id, Value: array of request timestamps
 */
const rateLimitTracker = new Map<string, number[]>()

/**
 * Clean up old requests from rate limit tracker
 */
function cleanupRateLimitTracker(projectId: string, windowMs: number): void {
  const now = Date.now()
  const requests = rateLimitTracker.get(projectId) || []
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs)

  if (validRequests.length > 0) {
    rateLimitTracker.set(projectId, validRequests)
  } else {
    rateLimitTracker.delete(projectId)
  }
}

/**
 * API Gateway Snapshot Client
 *
 * Provides methods to fetch and consume control plane snapshots
 * with local caching, rate limiting, and fail-closed behavior.
 */
export class ApiGatewaySnapshotClient {
  private config: SnapshotClientConfig

  constructor(config: Partial<SnapshotClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Fetch a snapshot from the control plane
   * @param projectId - Project ID to fetch snapshot for
   * @returns Snapshot fetch result
   */
  async fetchSnapshot(projectId: string): Promise<SnapshotFetchResult> {
    try {
      const url = `${this.config.controlPlaneUrl}/api/internal/snapshot?project_id=${projectId}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 503) {
          console.error('[ApiGateway Snapshot] Control plane unavailable (503)')
          return {
            success: false,
            error: 'Control plane unavailable',
          }
        }

        if (response.status === 404) {
          console.error(`[ApiGateway Snapshot] Project not found: ${projectId}`)
          return {
            success: false,
            error: 'Project not found',
          }
        }

        console.error(`[ApiGateway Snapshot] Unexpected response: ${response.status}`)
        return {
          success: false,
          error: `Unexpected response: ${response.status}`,
        }
      }

      const data = await response.json()

      if (!data.snapshot) {
        console.error('[ApiGateway Snapshot] No snapshot in response')
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
        console.error('[ApiGateway Snapshot] Request timeout')
        return {
          success: false,
          error: 'Request timeout',
        }
      }

      console.error('[ApiGateway Snapshot] Fetch error:', error)
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
      return null
    }

    // Compare versions if we have a cached entry
    if (cached) {
      if (cached.snapshot.version !== result.snapshot.version) {
        console.log(
          `[API Gateway Snapshot] Version changed for project ${projectId}: ${cached.snapshot.version} -> ${result.snapshot.version}`
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
   * Validate project status for request processing
   * @param projectId - Project ID to validate
   * @returns true if project is active, false otherwise (fail-closed)
   */
  async isProjectActive(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      // Fail closed - deny if snapshot unavailable
      console.error(`[ApiGateway Snapshot] Snapshot unavailable for project ${projectId}`)
      return false
    }

    // Check if status is ACTIVE or CREATED (both allow API access)
    const isActive = snapshot.project.status === 'ACTIVE' || snapshot.project.status === 'CREATED'

    if (!isActive) {
      console.log(`[ApiGateway Snapshot] Project ${projectId} is not active: ${snapshot.project.status}`)
    }

    return isActive
  }

  /**
   * Check if a service is enabled for a project
   * @param projectId - Project ID to check
   * @param service - Service to check
   * @returns true if service is enabled, false otherwise (fail-closed)
   */
  async isServiceEnabled(projectId: string, service: GatewayService): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      // Fail closed - deny if snapshot unavailable
      console.error(`[ApiGateway Snapshot] Snapshot unavailable for project ${projectId}`)
      return false
    }

    const serviceConfig = snapshot.services[service]
    const isEnabled = serviceConfig?.enabled ?? false

    if (!isEnabled) {
      console.log(`[ApiGateway Snapshot] Service ${service} not enabled for project ${projectId}`)
    }

    return isEnabled
  }

  /**
   * Check rate limit for a project
   *
   * US-004: Rate limit checking uses environment config multiplier.
   * - Dev environment gets 10x rate limit
   * - Staging gets 5x rate limit
   * - Prod gets standard rate limit (1x multiplier)
   *
   * @param projectId - Project ID to check
   * @returns Rate limit check result
   */
  async checkRateLimit(projectId: string): Promise<RateLimitCheckResult> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      // Fail closed - deny if snapshot unavailable
      console.error(`[ApiGateway Snapshot] Snapshot unavailable for project ${projectId}`)
      return {
        allowed: false,
        reason: 'Control plane unavailable',
      }
    }

    const limits = snapshot.limits
    const now = Date.now()

    // Get environment config for rate limit multiplier
    const environment = mapSnapshotEnvironment(snapshot.project.environment)
    const envConfig = getEnvironmentConfig(environment)
    const rateLimitMultiplier = envConfig.rate_limit_multiplier

    // Calculate effective rate limit with environment multiplier
    const effectiveLimit = Math.floor(limits.requests_per_minute * rateLimitMultiplier)

    // Clean up old requests
    cleanupRateLimitTracker(projectId, 60 * 1000) // 1 minute window

    // Get current requests
    const requests = rateLimitTracker.get(projectId) || []

    // Check per-minute limit with environment multiplier applied
    if (requests.length >= effectiveLimit) {
      console.log(`[ApiGateway Snapshot] Rate limit exceeded for project ${projectId} (per-minute: ${requests.length}/${effectiveLimit}, env: ${environment})`)
      return {
        allowed: false,
        reason: 'Rate limit exceeded (per-minute)',
        retryAfter: 60,
      }
    }

    // Add current request
    requests.push(now)
    rateLimitTracker.set(projectId, requests)

    return {
      allowed: true,
    }
  }

  /**
   * Validate request before processing
   * Checks: project status, service enablement, rate limits
   * @param projectId - Project ID to validate
   * @param service - Service being accessed
   * @returns Validation result
   */
  async validateRequest(
    projectId: string,
    service: GatewayService
  ): Promise<{
    allowed: boolean
    reason?: string
    retryAfter?: number
  }> {
    // Check project status
    const isActive = await this.isProjectActive(projectId)
    if (!isActive) {
      const snapshot = await this.getSnapshot(projectId)
      const status = snapshot?.project.status || 'unknown'

      // Determine the reason based on status
      let reason: string | undefined

      if (status === 'SUSPENDED') {
        reason = 'PROJECT_SUSPENDED'
      } else if (status === 'ARCHIVED') {
        reason = 'PROJECT_ARCHIVED'
      } else if (status === 'DELETED') {
        reason = 'PROJECT_DELETED'
      } else if (status === 'CREATED') {
        // CREATED projects should be allowed, this shouldn't happen
        reason = 'PROJECT_NOT_ACTIVE'
      } else {
        reason = 'PROJECT_NOT_ACTIVE'
      }

      return {
        allowed: false,
        reason,
      }
    }

    // Check service enablement
    const isServiceEnabled = await this.isServiceEnabled(projectId, service)
    if (!isServiceEnabled) {
      return {
        allowed: false,
        reason: 'SERVICE_DISABLED',
      }
    }

    // Check rate limits
    const rateLimitResult = await this.checkRateLimit(projectId)
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        reason: rateLimitResult.reason || 'RATE_LIMITED',
        retryAfter: rateLimitResult.retryAfter,
      }
    }

    return {
      allowed: true,
    }
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
   * Invalidate cached snapshot for a project
   * Call this when you know project state has changed
   * @param projectId - Project ID to invalidate cache for
   */
  invalidateCache(projectId: string): void {
    snapshotCache.delete(projectId)
    rateLimitTracker.delete(projectId)
    console.log(`[ApiGateway Snapshot] Invalidated cache for project ${projectId}`)
  }

  /**
   * Clear all cached snapshots
   */
  clearCache(): void {
    snapshotCache.clear()
    rateLimitTracker.clear()
    console.log('[ApiGateway Snapshot] Cleared all cache')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    snapshotCacheSize: number
    rateLimitTrackerSize: number
    snapshotEntries: Array<{ projectId: string; expiresAt: Date }>
  } {
    return {
      snapshotCacheSize: snapshotCache.size,
      rateLimitTrackerSize: rateLimitTracker.size,
      snapshotEntries: Array.from(snapshotCache.entries()).map(([projectId, cached]) => ({
        projectId,
        expiresAt: new Date(cached.expiresAt),
      })),
    }
  }
}

/**
 * Default singleton instance of the snapshot client
 */
export const apiGatewaySnapshotClient = new ApiGatewaySnapshotClient()

/**
 * Convenience functions using the default client
 */

/**
 * Validate a request before processing
 * @param projectId - Project ID to validate
 * @param service - Service being accessed
 * @returns Validation result
 */
export async function validateGatewayRequest(
  projectId: string,
  service: GatewayService
): Promise<{
  allowed: boolean
  reason?: string
  retryAfter?: number
}> {
  return apiGatewaySnapshotClient.validateRequest(projectId, service)
}

/**
 * Check if a project is active
 * @param projectId - Project ID to check
 * @returns true if project is active
 */
export async function isGatewayProjectActive(projectId: string): Promise<boolean> {
  return apiGatewaySnapshotClient.isProjectActive(projectId)
}

/**
 * Check if a service is enabled for a project
 * @param projectId - Project ID to check
 * @param service - Service to check
 * @returns true if service is enabled
 */
export async function isGatewayServiceEnabled(
  projectId: string,
  service: GatewayService
): Promise<boolean> {
  return apiGatewaySnapshotClient.isServiceEnabled(projectId, service)
}

/**
 * Check rate limit for a project
 * @param projectId - Project ID to check
 * @returns Rate limit check result
 */
export async function checkGatewayRateLimit(projectId: string): Promise<RateLimitCheckResult> {
  return apiGatewaySnapshotClient.checkRateLimit(projectId)
}

/**
 * Invalidate cached snapshot for a project
 * @param projectId - Project ID to invalidate
 */
export function invalidateGatewaySnapshotCache(projectId: string): void {
  apiGatewaySnapshotClient.invalidateCache(projectId)
}

/**
 * Clear all cached snapshots
 */
export function clearGatewaySnapshotCache(): void {
  apiGatewaySnapshotClient.clearCache()
}

/**
 * Get cache statistics
 */
export function getGatewaySnapshotCacheStats(): {
  snapshotCacheSize: number
  rateLimitTrackerSize: number
  snapshotEntries: Array<{ projectId: string; expiresAt: Date }>
} {
  return apiGatewaySnapshotClient.getCacheStats()
}

/**
 * Clean up expired cache entries
 * Call this periodically to remove stale entries
 */
export function cleanupExpiredGatewayCacheEntries(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [projectId, cached] of snapshotCache.entries()) {
    if (cached.expiresAt < now) {
      snapshotCache.delete(projectId)
      rateLimitTracker.delete(projectId)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[ApiGateway Snapshot] Cleaned up ${cleaned} expired cache entries`)
  }

  return cleaned
}

/**
 * Clean up old rate limit tracking data
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitTrackingData(): number {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  let cleaned = 0

  for (const [projectId, requests] of rateLimitTracker.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs)

    if (validRequests.length === 0) {
      rateLimitTracker.delete(projectId)
      cleaned++
    } else if (validRequests.length < requests.length) {
      rateLimitTracker.set(projectId, validRequests)
    }
  }

  if (cleaned > 0) {
    console.log(`[ApiGateway Snapshot] Cleaned up ${cleaned} stale rate limit tracking entries`)
  }

  return cleaned
}

// Start periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredGatewayCacheEntries()
    cleanupRateLimitTrackingData()
  }, 5 * 60 * 1000)
}
