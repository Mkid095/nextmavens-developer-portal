/**
 * Snapshot Module
 *
 * Exports all snapshot-related functionality for internal use.
 */

export * from './types'
export * from './cache'
export * from './builder'

/**
 * Snapshot API utilities for manual cache management
 */
export class SnapshotCacheManager {
  /**
   * Invalidate cache for a specific project
   * Call this when project configuration changes
   */
  static invalidate(projectId: string): void {
    const { invalidateSnapshot } = require('./cache')
    invalidateSnapshot(projectId)
  }

  /**
   * Clear all cached snapshots
   */
  static clearAll(): void {
    const { clearAllSnapshots } = require('./cache')
    clearAllSnapshots()
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const { getCacheStats } = require('./cache')
    return getCacheStats()
  }

  /**
   * Clean up expired entries
   */
  static cleanup(): number {
    const { cleanupExpiredEntries } = require('./cache')
    return cleanupExpiredEntries()
  }
}
