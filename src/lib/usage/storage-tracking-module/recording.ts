/**
 * Storage Usage Tracking - Module - Recording Functions
 */

import type { StorageUsageMetric } from '../types'
import { validateStorageMetric, validateStorageMetrics } from '../validators'
import { insertMetric, insertMetrics } from './db-operations'

/**
 * Record a storage usage metric
 *
 * Records the metric to the usage_metrics table asynchronously.
 * This function is designed to be called in a fire-and-forget manner
 * to avoid blocking API requests.
 */
export async function recordStorageMetric(
  metric: StorageUsageMetric
): Promise<void> {
  const validation = validateStorageMetric(metric)
  if (!validation.valid) {
    console.error(`[StorageUsageTracking] ${validation.error}`)
    return
  }

  try {
    await insertMetric(metric)

    // Debug logging (can be disabled in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[StorageUsageTracking] Recorded: ${metric.metricType} = ${metric.quantity} for project ${metric.projectId}`)
    }
  } catch (error: unknown) {
    // Don't throw - this is a fire-and-forget operation
    console.error('[StorageUsageTracking] Failed to record metric:', {
      projectId: metric.projectId,
      metricType: metric.metricType,
      quantity: metric.quantity,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Record multiple storage metrics in a single query
 *
 * More efficient than recording metrics individually when you have
 * multiple metrics to track for a single request.
 */
export async function recordStorageMetrics(
  metrics: StorageUsageMetric[]
): Promise<void> {
  const validation = validateStorageMetrics(metrics)
  if (!validation.valid) {
    console.error(`[StorageUsageTracking] ${validation.error}`)
    return
  }

  try {
    await insertMetrics(metrics)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[StorageUsageTracking] Recorded ${metrics.length} metrics`)
    }
  } catch (error: unknown) {
    console.error('[StorageUsageTracking] Failed to record metrics:', {
      metricCount: metrics.length,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Track storage upload
 *
 * Convenience function for recording a storage upload with bytes transferred.
 */
export function trackStorageUpload(
  projectId: string,
  bytesTransferred: number = 0
): void {
  // Don't await - fire and forget
  recordStorageMetrics([
    { projectId, metricType: 'storage_upload', quantity: 1 },
    { projectId, metricType: 'storage_bytes', quantity: bytesTransferred },
  ]).catch(err => {
    // Silent fail - logging errors in the recording function
  })
}

/**
 * Track storage download
 *
 * Convenience function for recording a storage download with bytes transferred.
 */
export function trackStorageDownload(
  projectId: string,
  bytesTransferred: number = 0
): void {
  // Don't await - fire and forget
  recordStorageMetrics([
    { projectId, metricType: 'storage_download', quantity: 1 },
    { projectId, metricType: 'storage_bytes', quantity: bytesTransferred },
  ]).catch(err => {
    // Silent fail - logging errors in the recording function
  })
}
