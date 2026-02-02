/**
 * Convenience functions using the default GraphQL Service Snapshot Client
 *
 * US-005: Add Correlation ID to GraphQL Service
 */

import { cleanupExpiredCacheEntries } from './cache'
import type { GraphQLOperationResult } from './types'
import { GraphQLServiceSnapshotClient } from './client'

/**
 * Default singleton instance of the snapshot client
 */
export const graphqlServiceSnapshotClient = new GraphQLServiceSnapshotClient()

/**
 * Validate if a GraphQL operation should be allowed
 * @param projectId - Project ID to check
 * @returns GraphQL operation result with allowed flag and optional reason
 */
export async function validateGraphQLOperation(
  projectId: string
): Promise<GraphQLOperationResult> {
  return graphqlServiceSnapshotClient.validateGraphQLOperation(projectId)
}

/**
 * Check if a GraphQL query can be executed
 * @param projectId - Project ID to check
 * @returns true if query execution should be allowed
 */
export async function canExecuteQuery(projectId: string): Promise<boolean> {
  return graphqlServiceSnapshotClient.canExecuteQuery(projectId)
}

/**
 * Check if a project is active
 * @param projectId - Project ID to check
 * @returns true if project is active
 */
export async function isGraphQLProjectActive(projectId: string): Promise<boolean> {
  return graphqlServiceSnapshotClient.isProjectActive(projectId)
}

/**
 * Check if GraphQL service is enabled for a project
 * @param projectId - Project ID to check
 * @returns true if GraphQL service is enabled
 */
export async function isGraphQLServiceEnabledFn(projectId: string): Promise<boolean> {
  return graphqlServiceSnapshotClient.isGraphQLServiceEnabled(projectId)
}

/**
 * Get quota limits for GraphQL operations
 * @param projectId - Project ID
 * @returns Quota configuration or null
 */
export async function getGraphQLQuotas(projectId: string) {
  return graphqlServiceSnapshotClient.getQuotas(projectId)
}

/**
 * Get rate limit configuration for a project
 * @param projectId - Project ID
 * @returns Rate limit configuration or null
 */
export async function getGraphQLRateLimits(projectId: string) {
  return graphqlServiceSnapshotClient.getRateLimits(projectId)
}

/**
 * Get project environment
 * @param projectId - Project ID
 * @returns Project environment or null
 */
export async function getGraphQLProjectEnvironment(projectId: string): Promise<string | null> {
  return graphqlServiceSnapshotClient.getProjectEnvironment(projectId)
}

/**
 * Invalidate cached snapshot for a project
 * @param projectId - Project ID to invalidate
 */
export function invalidateGraphQLSnapshotCache(projectId: string): void {
  graphqlServiceSnapshotClient.invalidateCache(projectId)
}

/**
 * Clear all cached snapshots
 */
export function clearGraphQLSnapshotCache(): void {
  graphqlServiceSnapshotClient.clearCache()
}

/**
 * Get cache statistics
 */
export function getGraphQLSnapshotCacheStats() {
  return graphqlServiceSnapshotClient.getCacheStats()
}

/**
 * Set the correlation ID for the current request
 * Call this at the start of each request to enable tracing
 * @param correlationId - The correlation ID from x-request-id header
 *
 * @example
 * ```typescript
 * import { setGraphQLCorrelationId } from '@/lib/graphql-service'
 * import { withCorrelationId } from '@/lib/middleware/correlation'
 *
 * export async function POST(req: NextRequest) {
 *   const correlationId = withCorrelationId(req)
 *   setGraphQLCorrelationId(correlationId)
 *   // ... rest of handler
 * }
 * ```
 */
export function setGraphQLCorrelationId(correlationId: string): void {
  graphqlServiceSnapshotClient.setCorrelationId(correlationId)
}

/**
 * Get the current correlation ID
 * @returns The correlation ID
 */
export function getGraphQLCorrelationId(): string {
  return graphqlServiceSnapshotClient.getCorrelationId()
}

/**
 * Clear the request context (call between requests)
 */
export function clearGraphQLContext(): void {
  graphqlServiceSnapshotClient.clearContext()
}

/**
 * Clean up expired cache entries
 * Call this periodically to remove stale entries
 */
export function cleanupExpiredGraphQLCacheEntries(): number {
  return cleanupExpiredCacheEntries((msg) => `[GraphQL Service Snapshot] [${graphqlServiceSnapshotClient.getCorrelationId()}] ${msg}`)
}

// Start periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredGraphQLCacheEntries()
  }, 5 * 60 * 1000)
}
