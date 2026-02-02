/**
 * Storage Service Snapshot Client
 *
 * Client library for the storage service to consume control plane snapshots.
 * This allows the storage service to validate project status and enforce
 * storage quotas without hitting the control database directly.
 *
 * SNAPSHOTS ARE CACHED LOCALLY with TTL to reduce control plane load.
 *
 * FAIL-CLOSED BEHAVIOR:
 * - All operations return false (deny) when snapshot is unavailable
 * - Storage operations are blocked when control plane is down
 * - This ensures security is never compromised
 *
 * US-008: Update Storage Service to Consume Snapshot
 * US-007: Add Correlation ID to Storage Service
 * - Supports correlation ID propagation via x-request-id header
 * - All logs include correlation ID for request tracing
 */

import { ControlPlaneSnapshot, ProjectStatus } from '@/lib/snapshot/types'
import { generateCorrelationId, CORRELATION_HEADER } from '@/lib/middleware/correlation'

/**
 * Request context for correlation ID tracking
 */
interface RequestContext {
  correlationId?: string
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
 * Storage operation result
 */
interface StorageOperationResult {
  allowed: boolean
  reason?: string
  quota?: number
  remaining?: number
}

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
 * Storage Service Snapshot Client
 *
 * Provides methods to fetch and consume control plane snapshots
 * with local caching and fail-closed behavior.
 */
export class StorageServiceSnapshotClient {
  private config: SnapshotClientConfig
  private requestContext: RequestContext

  constructor(config: Partial<SnapshotClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.requestContext = {}
  }

  /**
   * Set the correlation ID for the current request context
   * This allows correlation IDs to be propagated to the control plane
   * @param correlationId - The correlation ID from the incoming request
   */
  setCorrelationId(correlationId: string): void {
    this.requestContext.correlationId = correlationId
  }

  /**
   * Get the current correlation ID from context
   * Generates a new one if not set
   * @returns The correlation ID
   */
  getCorrelationId(): string {
    if (!this.requestContext.correlationId) {
      this.requestContext.correlationId = generateCorrelationId()
    }
    return this.requestContext.correlationId
  }

  /**
   * Clear the request context (call between requests)
   */
  clearContext(): void {
    this.requestContext = {}
  }

  /**
   * Format a log message with correlation ID
   * @param message - The log message
   * @returns Formatted message with correlation ID
   */
  private formatLog(message: string): string {
    const correlationId = this.getCorrelationId()
    return `[Storage Service Snapshot] [${correlationId}] ${message}`
  }

  /**
   * Fetch a snapshot from the control plane
   * @param projectId - Project ID to fetch snapshot for
   * @returns Snapshot fetch result
   */
  async fetchSnapshot(projectId: string): Promise<SnapshotFetchResult> {
    try {
      const url = `${this.config.controlPlaneUrl}/api/internal/snapshot?project_id=${projectId}`
      const correlationId = this.getCorrelationId()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          // US-007: Propagate correlation ID to control plane
          [CORRELATION_HEADER]: correlationId,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 503) {
          console.error(this.formatLog('Control plane unavailable (503)'))
          return {
            success: false,
            error: 'Control plane unavailable',
          }
        }

        if (response.status === 404) {
          console.error(this.formatLog(`Project not found: ${projectId}`))
          return {
            success: false,
            error: 'Project not found',
          }
        }

        console.error(this.formatLog(`Unexpected response: ${response.status}`))
        return {
          success: false,
          error: `Unexpected response: ${response.status}`,
        }
      }

      const data = await response.json()

      if (!data.snapshot) {
        console.error(this.formatLog('No snapshot in response'))
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
        console.error(this.formatLog('Request timeout'))
        return {
          success: false,
          error: 'Request timeout',
        }
      }

      console.error(this.formatLog('Fetch error:'), error)
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
          this.formatLog(`Version changed for project ${projectId}: ${cached.snapshot.version} -> ${result.snapshot.version}`)
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
      console.error(this.formatLog(`Snapshot unavailable for project ${projectId}`))
      return false
    }

    const isActive = snapshot.project.status === 'ACTIVE'

    if (!isActive) {
      console.log(this.formatLog(`Project ${projectId} is not active: ${snapshot.project.status}`))
    }

    return isActive
  }

  /**
   * Check if storage service is enabled for a project
   * @param projectId - Project ID to check
   * @returns true if storage service is enabled, false otherwise (fail-closed)
   */
  async isStorageServiceEnabled(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      // Fail closed - deny if snapshot unavailable
      console.error(this.formatLog(`Snapshot unavailable for project ${projectId}`))
      return false
    }

    const isEnabled = snapshot.services.storage?.enabled ?? false

    if (!isEnabled) {
      console.log(this.formatLog(`Storage service not enabled for project ${projectId}`))
    }

    return isEnabled
  }

  /**
   * Get the storage upload quota for a project
   * @param projectId - Project ID
   * @returns Storage upload quota or null
   */
  async getStorageUploadQuota(projectId: string): Promise<number | null> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      return null
    }

    return snapshot.quotas.storage_uploads_per_day
  }

  /**
   * Validate if a storage operation should be allowed
   * This is the main method to call before any storage operation
   * @param projectId - Project ID to check
   * @returns Storage operation result with allowed flag and optional reason
   */
  async validateStorageOperation(projectId: string): Promise<StorageOperationResult> {
    // Check project status
    const isActive = await this.isProjectActive(projectId)
    if (!isActive) {
      const snapshot = await this.getSnapshot(projectId)
      const status = snapshot?.project.status || 'unknown'

      let reason: string
      switch (status) {
        case 'SUSPENDED':
          reason = 'PROJECT_SUSPENDED'
          break
        case 'ARCHIVED':
          reason = 'PROJECT_ARCHIVED'
          break
        case 'DELETED':
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

    // Check storage service enablement
    const isEnabled = await this.isStorageServiceEnabled(projectId)
    if (!isEnabled) {
      return {
        allowed: false,
        reason: 'STORAGE_SERVICE_DISABLED',
      }
    }

    // Get quota
    const quota = await this.getStorageUploadQuota(projectId)

    return {
      allowed: true,
      quota: quota ?? undefined,
    }
  }

  /**
   * Check if a storage operation can be performed
   * Convenience method that returns boolean for simple checks
   * @param projectId - Project ID to check
   * @returns true if operation should be allowed, false otherwise (fail-closed)
   */
  async canPerformStorageOperation(projectId: string): Promise<boolean> {
    const result = await this.validateStorageOperation(projectId)
    return result.allowed
  }

  /**
   * Get quota limits for storage operations
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
    console.log(this.formatLog(`Invalidated cache for project ${projectId}`))
  }

  /**
   * Clear all cached snapshots
   */
  clearCache(): void {
    snapshotCache.clear()
    console.log(this.formatLog('Cleared all cache'))
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    entries: Array<{ projectId: string; expiresAt: Date }>
  } {
    return {
      size: snapshotCache.size,
      entries: Array.from(snapshotCache.entries()).map(([projectId, cached]) => ({
        projectId,
        expiresAt: new Date(cached.expiresAt),
      })),
    }
  }
}

/**
 * Default singleton instance of the snapshot client
 */
export const storageServiceSnapshotClient = new StorageServiceSnapshotClient()

/**
 * Convenience functions using the default client
 */

/**
 * Validate if a storage operation should be allowed
 * @param projectId - Project ID to check
 * @returns Storage operation result with allowed flag and optional reason
 */
export async function validateStorageOperation(
  projectId: string
): Promise<StorageOperationResult> {
  return storageServiceSnapshotClient.validateStorageOperation(projectId)
}

/**
 * Check if a storage operation can be performed
 * @param projectId - Project ID to check
 * @returns true if operation should be allowed
 */
export async function canPerformStorageOperation(projectId: string): Promise<boolean> {
  return storageServiceSnapshotClient.canPerformStorageOperation(projectId)
}

/**
 * Check if a project is active
 * @param projectId - Project ID to check
 * @returns true if project is active
 */
export async function isStorageProjectActive(projectId: string): Promise<boolean> {
  return storageServiceSnapshotClient.isProjectActive(projectId)
}

/**
 * Check if storage service is enabled for a project
 * @param projectId - Project ID to check
 * @returns true if storage service is enabled
 */
export async function isStorageServiceEnabled(projectId: string): Promise<boolean> {
  return storageServiceSnapshotClient.isStorageServiceEnabled(projectId)
}

/**
 * Get storage upload quota for a project
 * @param projectId - Project ID
 * @returns Storage upload quota or null
 */
export async function getStorageUploadQuota(projectId: string): Promise<number | null> {
  return storageServiceSnapshotClient.getStorageUploadQuota(projectId)
}

/**
 * Get quota limits for storage operations
 * @param projectId - Project ID
 * @returns Quota configuration or null
 */
export async function getStorageQuotas(
  projectId: string
): Promise<ControlPlaneSnapshot['quotas'] | null> {
  return storageServiceSnapshotClient.getQuotas(projectId)
}

/**
 * Get rate limit configuration for a project
 * @param projectId - Project ID
 * @returns Rate limit configuration or null
 */
export async function getStorageRateLimits(
  projectId: string
): Promise<ControlPlaneSnapshot['limits'] | null> {
  return storageServiceSnapshotClient.getRateLimits(projectId)
}

/**
 * Get project environment
 * @param projectId - Project ID
 * @returns Project environment or null
 */
export async function getStorageProjectEnvironment(projectId: string): Promise<string | null> {
  return storageServiceSnapshotClient.getProjectEnvironment(projectId)
}

/**
 * Invalidate cached snapshot for a project
 * @param projectId - Project ID to invalidate
 */
export function invalidateStorageSnapshotCache(projectId: string): void {
  storageServiceSnapshotClient.invalidateCache(projectId)
}

/**
 * Clear all cached snapshots
 */
export function clearStorageSnapshotCache(): void {
  storageServiceSnapshotClient.clearCache()
}

/**
 * Get cache statistics
 */
export function getStorageSnapshotCacheStats(): {
  size: number
  entries: Array<{ projectId: string; expiresAt: Date }>
} {
  return storageServiceSnapshotClient.getCacheStats()
}

/**
 * Clean up expired cache entries
 * Call this periodically to remove stale entries
 */
export function cleanupExpiredStorageCacheEntries(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [projectId, cached] of snapshotCache.entries()) {
    if (cached.expiresAt < now) {
      snapshotCache.delete(projectId)
      cleaned++
    }
  }

  if (cleaned > 0) {
    const correlationId = storageServiceSnapshotClient.getCorrelationId()
    console.log(`[Storage Service Snapshot] [${correlationId}] Cleaned up ${cleaned} expired cache entries`)
  }

  return cleaned
}

/**
 * Set the correlation ID for the current storage service request
 * Call this at the start of each request to enable tracing
 * @param correlationId - The correlation ID from x-request-id header
 *
 * @example
 * ```typescript
 * import { setStorageCorrelationId } from '@/lib/storage-service'
 * import { withCorrelationId } from '@/lib/middleware/correlation'
 *
 * export async function POST(req: NextRequest) {
 *   const correlationId = withCorrelationId(req)
 *   setStorageCorrelationId(correlationId)
 *   // ... rest of handler
 * }
 * ```
 */
export function setStorageCorrelationId(correlationId: string): void {
  storageServiceSnapshotClient.setCorrelationId(correlationId)
}

/**
 * Get the current correlation ID
 * @returns The correlation ID
 */
export function getStorageCorrelationId(): string {
  return storageServiceSnapshotClient.getCorrelationId()
}

/**
 * Clear the request context (call between requests)
 */
export function clearStorageContext(): void {
  storageServiceSnapshotClient.clearContext()
}

// Start periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredStorageCacheEntries()
  }, 5 * 60 * 1000)
}
