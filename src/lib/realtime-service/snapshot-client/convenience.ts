/**
 * Convenience Functions
 * Convenience functions using the default client instance
 */

import { realtimeServiceSnapshotClient } from './client'
import type { ConnectionValidationResult } from './snapshot-client/types'
import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import { cleanupExpiredCacheEntries, formatLogMessage } from './request-context'

/**
 * Default singleton instance of the snapshot client
 */
export { realtimeServiceSnapshotClient }

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
export async function isRealtimeServiceEnabledFn(projectId: string): Promise<boolean> {
  return realtimeServiceSnapshotClient.isRealtimeServiceEnabled(projectId)
}

// Re-export with a different name to avoid conflict
export { isRealtimeServiceEnabledFn as isRealtimeServiceEnabled }

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
export function getActiveConnectionCountFn(projectId: string): number {
  return realtimeServiceSnapshotClient.getActiveConnectionCount(projectId)
}

/**
 * Increment active connection count for a project
 * @param projectId - Project ID
 * @returns New connection count
 */
export function incrementConnectionCountFn(projectId: string): number {
  return realtimeServiceSnapshotClient.incrementConnectionCount(projectId)
}

/**
 * Decrement active connection count for a project
 * @param projectId - Project ID
 * @returns New connection count
 */
export function decrementConnectionCountFn(projectId: string): number {
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
export function clearAllConnectionCountsFn(): void {
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
  const cleaned = cleanupExpiredCacheEntries()
  if (cleaned > 0) {
    console.log(formatLogMessage(`Cleaned up ${cleaned} expired cache entries`))
  }
  return cleaned
}

// Re-export request context functions
export {
  setRequestCorrelationId,
  getRequestCorrelationId,
  clearRequestContext,
  formatLogMessage,
} from './request-context'
