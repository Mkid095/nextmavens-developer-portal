/**
 * Auth Service Snapshot Client - Convenience Functions
 *
 * Convenience functions using the default client instance.
 */

import { AuthServiceSnapshotClient } from './client'

/**
 * Default singleton instance of the snapshot client
 */
export const authServiceSnapshotClient = new AuthServiceSnapshotClient()

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
