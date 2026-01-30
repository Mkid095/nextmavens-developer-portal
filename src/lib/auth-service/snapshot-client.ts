/**
 * Auth Service Snapshot Client
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

import { ControlPlaneSnapshot, ProjectStatus } from '@/lib/snapshot/types'

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
 * Auth Service Snapshot Client
 *
 * Provides methods to fetch and consume control plane snapshots
 * with local caching and fail-closed behavior.
 */
export class AuthServiceSnapshotClient {
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
          console.error('[AuthService Snapshot] Control plane unavailable (503)')
          return {
            success: false,
            error: 'Control plane unavailable',
          }
        }

        if (response.status === 404) {
          console.error(`[AuthService Snapshot] Project not found: ${projectId}`)
          return {
            success: false,
            error: 'Project not found',
          }
        }

        console.error(`[AuthService Snapshot] Unexpected response: ${response.status}`)
        return {
          success: false,
          error: `Unexpected response: ${response.status}`,
        }
      }

      const data = await response.json()

      if (!data.snapshot) {
        console.error('[AuthService Snapshot] No snapshot in response')
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
        console.error('[AuthService Snapshot] Request timeout')
        return {
          success: false,
          error: 'Request timeout',
        }
      }

      console.error('[AuthService Snapshot] Fetch error:', error)
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
      // Check if we should refresh due to version change
      // We'll let TTL handle the refresh, but log version for debugging
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
          `[AuthService Snapshot] Version changed for project ${projectId}: ${cached.snapshot.version} -> ${result.snapshot.version}`
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
      return false
    }

    return snapshot.project.status === 'ACTIVE'
  }

  /**
   * Check if auth service is enabled for a project
   * @param projectId - Project ID to check
   * @returns true if auth service is enabled, false otherwise (fail-closed)
   */
  async isAuthServiceEnabled(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)

    if (!snapshot) {
      // Fail closed - deny if snapshot unavailable
      return false
    }

    return snapshot.services.auth?.enabled ?? false
  }

  /**
   * Check if an auth operation should be allowed
   * This is the main method to call before any auth operation
   * @param projectId - Project ID to check
   * @returns true if operation should be allowed, false otherwise (fail-closed)
   */
  async canPerformAuthOperation(projectId: string): Promise<boolean> {
    // Check project status
    const isActive = await this.isProjectActive(projectId)
    if (!isActive) {
      console.log(`[AuthService Snapshot] Project ${projectId} is not active`)
      return false
    }

    // Check auth service enablement
    const isEnabled = await this.isAuthServiceEnabled(projectId)
    if (!isEnabled) {
      console.log(`[AuthService Snapshot] Auth service not enabled for project ${projectId}`)
      return false
    }

    return true
  }

  /**
   * Invalidate cached snapshot for a project
   * Call this when you know project state has changed
   * @param projectId - Project ID to invalidate cache for
   */
  invalidateCache(projectId: string): void {
    snapshotCache.delete(projectId)
    console.log(`[AuthService Snapshot] Invalidated cache for project ${projectId}`)
  }

  /**
   * Clear all cached snapshots
   */
  clearCache(): void {
    snapshotCache.clear()
    console.log('[AuthService Snapshot] Cleared all cache')
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
export const authServiceSnapshotClient = new AuthServiceSnapshotClient()

/**
 * Convenience functions using the default client
 */

/**
 * Check if an auth operation should be allowed for a project
 * @param projectId - Project ID to check
 * @returns true if operation should be allowed
 */
export async function canPerformAuthOperation(projectId: string): Promise<boolean> {
  return authServiceSnapshotClient.canPerformAuthOperation(projectId)
}

/**
 * Check if a project is active
 * @param projectId - Project ID to check
 * @returns true if project is active
 */
export async function isProjectActive(projectId: string): Promise<boolean> {
  return authServiceSnapshotClient.isProjectActive(projectId)
}

/**
 * Check if auth service is enabled for a project
 * @param projectId - Project ID to check
 * @returns true if auth service is enabled
 */
export async function isAuthServiceEnabled(projectId: string): Promise<boolean> {
  return authServiceSnapshotClient.isAuthServiceEnabled(projectId)
}

/**
 * Invalidate cached snapshot for a project
 * @param projectId - Project ID to invalidate
 */
export function invalidateSnapshotCache(projectId: string): void {
  authServiceSnapshotClient.invalidateCache(projectId)
}

/**
 * Clear all cached snapshots
 */
export function clearSnapshotCache(): void {
  authServiceSnapshotClient.clearCache()
}

/**
 * Get cache statistics
 */
export function getSnapshotCacheStats(): {
  size: number
  entries: Array<{ projectId: string; expiresAt: Date }>
} {
  return authServiceSnapshotClient.getCacheStats()
}

/**
 * Clean up expired cache entries
 * Call this periodically to remove stale entries
 */
export function cleanupExpiredCacheEntries(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [projectId, cached] of snapshotCache.entries()) {
    if (cached.expiresAt < now) {
      snapshotCache.delete(projectId)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[AuthService Snapshot] Cleaned up ${cleaned} expired cache entries`)
  }

  return cleaned
}

// Start periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredCacheEntries()
  }, 5 * 60 * 1000)
}
