/**
 * Storage Usage Tracking - Module - Query Functions
 */

import type { StorageUsageStats, CurrentStorageUsage, DayBreakdown } from '../types'
import { getAggregatedStats, getDailyBreakdown } from './db-operations'
import { DEFAULT_DAYS_AGO } from '../constants'

/**
 * Get storage usage statistics for a project
 *
 * Aggregates storage metrics for a project within a time range.
 */
export async function getStorageUsageStats(
  projectId: string,
  startDate: Date = new Date(Date.now() - DEFAULT_DAYS_AGO * 24 * 60 * 60 * 1000),
  endDate: Date = new Date()
): Promise<StorageUsageStats> {
  try {
    const aggregated = await getAggregatedStats(projectId, startDate, endDate)
    const breakdownByDay = await getDailyBreakdown(projectId, startDate, endDate)

    return {
      success: true,
      data: {
        uploadCount: aggregated.uploadCount,
        downloadCount: aggregated.downloadCount,
        bytesTransferred: aggregated.bytesTransferred,
        breakdownByDay,
      },
    }
  } catch (error: unknown) {
    console.error('[StorageUsageTracking] Error getting storage usage stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Get current storage usage for quota checking
 *
 * Returns usage counts for the current billing period (last 30 days).
 */
export async function getCurrentStorageUsage(
  projectId: string
): Promise<CurrentStorageUsage> {
  const stats = await getStorageUsageStats(projectId)

  if (!stats.success || !stats.data) {
    return stats
  }

  return {
    success: true,
    data: {
      uploadCount: stats.data.uploadCount,
      downloadCount: stats.data.downloadCount,
      bytesTransferred: stats.data.bytesTransferred,
    },
  }
}
