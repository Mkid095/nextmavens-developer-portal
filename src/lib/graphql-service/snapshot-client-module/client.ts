/**
 * GraphQL Service Snapshot Client - Main Client Class
 *
 * Client library for the GraphQL service to consume control plane snapshots.
 * This allows the GraphQL service to check project status and service enablement
 * without hitting the control database directly.
 *
 * SNAPSHOTS ARE CACHED LOCALLY with TTL to reduce control plane load.
 *
 * FAIL-CLOSED BEHAVIOR:
 * - All operations return false (deny) when snapshot is unavailable
 * - GraphQL query execution is blocked when control plane is down
 * - This ensures security is never compromised
 *
 * US-005: Add Correlation ID to GraphQL Service
 * - Supports correlation ID propagation via x-request-id header
 * - All logs include correlation ID for request tracing
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import { generateCorrelationId } from '@/lib/middleware/correlation'
import type {
  SnapshotClientConfig,
  RequestContext,
  GraphQLOperationResult,
} from '../snapshot-client/types'
import { DEFAULT_CONFIG } from '../snapshot-client/config'
import {
  getCachedSnapshot,
  setCachedSnapshot,
  isCacheValid,
  invalidateSnapshotCache,
  clearSnapshotCache,
  getSnapshotCacheStats,
} from '../snapshot-client/cache'
import { fetchSnapshot } from '../snapshot-client/fetcher'
import {
  isProjectActive,
  isGraphQLServiceEnabled,
  validateGraphQLOperation as validateSnapshotOperation,
} from '../snapshot-client/validation'

/**
 * GraphQL Service Snapshot Client
 *
 * Provides methods to fetch and consume control plane snapshots
 * with local caching and fail-closed behavior.
 */
export class GraphQLServiceSnapshotClient {
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
    return `[GraphQL Service Snapshot] [${correlationId}] ${message}`
  }

  /**
   * Fetch a snapshot from the control plane
   * @param projectId - Project ID to fetch snapshot for
   * @returns Snapshot fetch result
   */
  async fetchSnapshot(projectId: string) {
    return fetchSnapshot(projectId, this.config, this.getCorrelationId.bind(this), this.formatLog.bind(this))
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
    const cached = getCachedSnapshot(projectId)
    if (cached && isCacheValid(cached)) {
      return cached.snapshot
    }

    // Fetch from control plane
    const result = await this.fetchSnapshot(projectId)

    if (!result.success || !result.snapshot) {
      // Fail closed - remove from cache if exists
      invalidateSnapshotCache(projectId)
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
    return isProjectActive(snapshot, this.formatLog.bind(this), projectId)
  }

  /**
   * Check if GraphQL service is enabled for a project
   * @param projectId - Project ID to check
   * @returns true if GraphQL service is enabled, false otherwise (fail-closed)
   */
  async isGraphQLServiceEnabled(projectId: string): Promise<boolean> {
    const snapshot = await this.getSnapshot(projectId)
    return isGraphQLServiceEnabled(snapshot, this.formatLog.bind(this), projectId)
  }

  /**
   * Validate if a GraphQL operation should be allowed
   * This is the main method to call before any GraphQL query execution
   * US-007: Updated to use standardized error format
   * @param projectId - Project ID to check
   * @returns GraphQL operation result with allowed flag and optional error response
   */
  async validateGraphQLOperation(projectId: string): Promise<GraphQLOperationResult> {
    const snapshot = await this.getSnapshot(projectId)
    return validateSnapshotOperation(snapshot, this.formatLog.bind(this), projectId)
  }

  /**
   * Check if a GraphQL query can be executed
   * Convenience method that returns boolean for simple checks
   * @param projectId - Project ID to check
   * @returns true if query execution should be allowed, false otherwise (fail-closed)
   */
  async canExecuteQuery(projectId: string): Promise<boolean> {
    const result = await this.validateGraphQLOperation(projectId)
    return result.allowed
  }

  /**
   * Get quota limits for GraphQL operations
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
    invalidateSnapshotCache(projectId)
    console.log(this.formatLog(`Invalidated cache for project ${projectId}`))
  }

  /**
   * Clear all cached snapshots
   */
  clearCache(): void {
    clearSnapshotCache()
    console.log(this.formatLog('Cleared all cache'))
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return getSnapshotCacheStats()
  }
}

/**
 * Default singleton instance of the snapshot client
 */
export const graphqlServiceSnapshotClient = new GraphQLServiceSnapshotClient()
