/**
 * Storage Service Snapshot Client Cache
 * Snapshot cache management utilities
 */

import type { CachedSnapshot } from './types'

/**
 * In-memory snapshot cache
 * Key: project_id, Value: cached snapshot
 */
const snapshotCache = new Map<string, CachedSnapshot>()

/**
 * Get a cached snapshot for a project
 * @param projectId - Project ID
 * @returns Cached snapshot or undefined
 */
export function getCachedSnapshot(projectId: string): CachedSnapshot | undefined {
  return snapshotCache.get(projectId)
}

/**
 * Set a cached snapshot for a project
 * @param projectId - Project ID
 * @param cached - Cached snapshot entry
 */
export function setCachedSnapshot(projectId: string, cached: CachedSnapshot): void {
  snapshotCache.set(projectId, cached)
}

/**
 * Delete a cached snapshot for a project
 * @param projectId - Project ID
 */
export function deleteCachedSnapshot(projectId: string): void {
  snapshotCache.delete(projectId)
}

/**
 * Check if a cached snapshot is still valid (not expired)
 * @param cached - Cached snapshot entry
 * @returns true if still valid
 */
export function isCacheValid(cached: CachedSnapshot): boolean {
  return cached.expiresAt > Date.now()
}

/**
 * Invalidate cached snapshot for a project
 * @param projectId - Project ID
 */
export function invalidateSnapshotCache(projectId: string): void {
  snapshotCache.delete(projectId)
}

/**
 * Clear all cached snapshots
 */
export function clearSnapshotCache(): void {
  snapshotCache.clear()
}

/**
 * Get snapshot cache entries
 * @returns Array of cache entries
 */
export function getSnapshotEntries(): Array<{ projectId: string; expiresAt: Date }> {
  return Array.from(snapshotCache.entries()).map(([projectId, cached]) => ({
    projectId,
    expiresAt: new Date(cached.expiresAt),
  }))
}

/**
 * Clean up expired cache entries
 * @returns Number of entries cleaned
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

  return cleaned
}
