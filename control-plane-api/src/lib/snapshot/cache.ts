/**
 * Snapshot Cache
 *
 * In-memory cache for control plane snapshots with TTL-based invalidation.
 * Reduces database load by serving cached snapshots to data plane services.
 * Tracks version numbers to detect changes and invalidate cache on project updates.
 */

import { ControlPlaneSnapshot, SnapshotCacheEntry } from './types'

/**
 * In-memory cache store
 * Key: project_id, Value: cache entry
 */
const snapshotCache = new Map<string, SnapshotCacheEntry>()

/**
 * Version counter for each project
 * Key: project_id, Value: version number (increments on cache invalidation)
 */
const snapshotVersions = new Map<string, number>()

/**
 * Default cache TTL in milliseconds (45 seconds)
 */
const DEFAULT_TTL_MS = 45 * 1000

/**
 * Maximum cache size to prevent memory issues
 */
const MAX_CACHE_SIZE = 1000

/**
 * Get a cached snapshot if available and not expired
 */
export function getCachedSnapshot(projectId: string): ControlPlaneSnapshot | null {
  const entry = snapshotCache.get(projectId)

  if (!entry) {
    return null
  }

  // Check if expired
  if (entry.expiresAt < new Date()) {
    snapshotCache.delete(projectId)
    return null
  }

  return entry.snapshot
}

/**
 * Cache a snapshot with TTL
 */
export function setCachedSnapshot(
  projectId: string,
  snapshot: ControlPlaneSnapshot,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  // Prevent cache from growing too large
  if (snapshotCache.size >= MAX_CACHE_SIZE) {
    // Delete oldest entries (first 10% of cache)
    const entriesToDelete = Math.floor(MAX_CACHE_SIZE * 0.1)
    let deleted = 0
    for (const [key] of snapshotCache) {
      if (deleted >= entriesToDelete) break
      snapshotCache.delete(key)
      deleted++
    }
  }

  const entry: SnapshotCacheEntry = {
    snapshot,
    expiresAt: new Date(Date.now() + ttlMs),
  }

  snapshotCache.set(projectId, entry)
}

/**
 * Invalidate a specific project's cache entry and increment version
 * This should be called whenever project state changes (status, quotas, services)
 */
export function invalidateSnapshot(projectId: string): void {
  snapshotCache.delete(projectId)

  // Increment version counter for this project
  const currentVersion = snapshotVersions.get(projectId) || 0
  snapshotVersions.set(projectId, currentVersion + 1)

  console.log(`[Snapshot Cache] Invalidated cache for project ${projectId}, version: ${currentVersion + 1}`)
}

/**
 * Clear all cached snapshots
 */
export function clearAllSnapshots(): void {
  snapshotCache.clear()
}

/**
 * Get the current version number for a project
 * @param projectId - Project ID to get version for
 * @returns Current version number (starts at 1 for new projects)
 */
export function getSnapshotVersion(projectId: string): number {
  return snapshotVersions.get(projectId) || 1
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  maxSize: number
  entries: Array<{ projectId: string; expiresAt: Date; version: number }>
} {
  return {
    size: snapshotCache.size,
    maxSize: MAX_CACHE_SIZE,
    entries: Array.from(snapshotCache.entries()).map(([projectId, entry]) => ({
      projectId,
      expiresAt: entry.expiresAt,
      version: snapshotVersions.get(projectId) || 1,
    })),
  }
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries(): number {
  const now = new Date()
  let cleaned = 0

  for (const [projectId, entry] of snapshotCache.entries()) {
    if (entry.expiresAt < now) {
      snapshotCache.delete(projectId)
      cleaned++
    }
  }

  return cleaned
}

// Start a periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredEntries()
    if (cleaned > 0) {
      console.log(`[Snapshot Cache] Cleaned up ${cleaned} expired entries`)
    }
  }, 5 * 60 * 1000)
}
