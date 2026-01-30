/**
 * Storage Usage Tracking Service
 *
 * Tracks storage usage metrics for quota enforcement and billing:
 * - storage_upload: Number of file uploads
 * - storage_download: Number of file downloads
 * - storage_bytes: Number of bytes transferred
 *
 * All tracking is done asynchronously (fire-and-forget) to avoid blocking requests.
 *
 * US-004 from prd-usage-tracking.json
 */

import { getPool } from '@/lib/db'

export type StorageMetricType = 'storage_upload' | 'storage_download' | 'storage_bytes'

export interface StorageUsageMetric {
  projectId: string
  metricType: StorageMetricType
  quantity: number
}

/**
 * Record a storage usage metric
 *
 * Records the metric to the usage_metrics table asynchronously.
 * This function is designed to be called in a fire-and-forget manner
 * to avoid blocking API requests.
 *
 * @param metric - The metric to record
 * @returns Promise that resolves when recording is complete
 *
 * @example
 * // Fire and forget - don't await to avoid blocking the request
 * recordStorageMetric({
 *   projectId: 'abc-123',
 *   metricType: 'storage_upload',
 *   quantity: 1
 * }).catch(err => console.error('Failed to record metric:', err))
 */
export async function recordStorageMetric(
  metric: StorageUsageMetric
): Promise<void> {
  const { projectId, metricType, quantity } = metric

  // Validate inputs
  if (!projectId) {
    console.error('[StorageUsageTracking] Missing projectId')
    return
  }

  if (!['storage_upload', 'storage_download', 'storage_bytes'].includes(metricType)) {
    console.error('[StorageUsageTracking] Invalid metricType:', metricType)
    return
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    console.error('[StorageUsageTracking] Invalid quantity:', quantity)
    return
  }

  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ($1, 'storage', $2, $3, NOW())
      `,
      [projectId, metricType, quantity]
    )

    // Debug logging (can be disabled in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[StorageUsageTracking] Recorded: ${metricType} = ${quantity} for project ${projectId}`)
    }
  } catch (error: any) {
    // Don't throw - this is a fire-and-forget operation
    console.error('[StorageUsageTracking] Failed to record metric:', {
      projectId,
      metricType,
      quantity,
      error: error.message,
    })
  }
}

/**
 * Record multiple storage metrics in a single query
 *
 * More efficient than recording metrics individually when you have
 * multiple metrics to track for a single request.
 *
 * @param metrics - Array of metrics to record
 * @returns Promise that resolves when recording is complete
 *
 * @example
 * // Fire and forget
 * recordStorageMetrics([
 *   { projectId: 'abc-123', metricType: 'storage_upload', quantity: 1 },
 *   { projectId: 'abc-123', metricType: 'storage_bytes', quantity: 1024 }
 * ]).catch(err => console.error('Failed to record metrics:', err))
 */
export async function recordStorageMetrics(
  metrics: StorageUsageMetric[]
): Promise<void> {
  if (!metrics || metrics.length === 0) {
    return
  }

  const pool = getPool()

  try {
    // Build values array for bulk insert
    const values: any[] = []
    const placeholders: string[] = []

    metrics.forEach((metric, index) => {
      const baseIndex = index * 3
      values.push(metric.projectId, metric.metricType, metric.quantity)
      placeholders.push(`($${baseIndex + 1}, 'storage', $${baseIndex + 2}, $${baseIndex + 3}, NOW())`)
    })

    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ${placeholders.join(', ')}
      `,
      values
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(`[StorageUsageTracking] Recorded ${metrics.length} metrics`)
    }
  } catch (error: any) {
    console.error('[StorageUsageTracking] Failed to record metrics:', {
      metricCount: metrics.length,
      error: error.message,
    })
  }
}

/**
 * Track storage upload
 *
 * Convenience function for recording a storage upload with bytes transferred.
 *
 * @param projectId - The project ID
 * @param bytesTransferred - Number of bytes transferred (default: 0)
 *
 * @example
 * // Fire and forget
 * trackStorageUpload('abc-123', 1024)
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
 *
 * @param projectId - The project ID
 * @param bytesTransferred - Number of bytes transferred (default: 0)
 *
 * @example
 * // Fire and forget
 * trackStorageDownload('abc-123', 2048)
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

/**
 * Get storage usage statistics for a project
 *
 * Aggregates storage metrics for a project within a time range.
 *
 * @param projectId - The project ID
 * @param startDate - Start date for aggregation (default: 30 days ago)
 * @param endDate - End date for aggregation (default: now)
 * @returns Aggregated storage usage statistics
 */
export async function getStorageUsageStats(
  projectId: string,
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: Date = new Date()
): Promise<{
  success: boolean
  data?: {
    uploadCount: number
    downloadCount: number
    bytesTransferred: number
    breakdownByDay: Array<{
      date: string
      uploadCount: number
      downloadCount: number
      bytesTransferred: number
    }>
  }
  error?: string
}> {
  const pool = getPool()

  try {
    // Get aggregated stats
    const result = await pool.query(
      `
      SELECT
        SUM(CASE WHEN metric_type = 'storage_upload' THEN quantity ELSE 0 END) as upload_count,
        SUM(CASE WHEN metric_type = 'storage_download' THEN quantity ELSE 0 END) as download_count,
        SUM(CASE WHEN metric_type = 'storage_bytes' THEN quantity ELSE 0 END) as bytes_transferred
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'storage'
        AND recorded_at >= $2
        AND recorded_at <= $3
      `,
      [projectId, startDate, endDate]
    )

    const row = result.rows[0]
    const uploadCount = parseInt(row.upload_count) || 0
    const downloadCount = parseInt(row.download_count) || 0
    const bytesTransferred = parseInt(row.bytes_transferred) || 0

    // Get breakdown by day
    const breakdownResult = await pool.query(
      `
      SELECT
        DATE(recorded_at) as date,
        SUM(CASE WHEN metric_type = 'storage_upload' THEN quantity ELSE 0 END) as upload_count,
        SUM(CASE WHEN metric_type = 'storage_download' THEN quantity ELSE 0 END) as download_count,
        SUM(CASE WHEN metric_type = 'storage_bytes' THEN quantity ELSE 0 END) as bytes_transferred
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'storage'
        AND recorded_at >= $2
        AND recorded_at <= $3
      GROUP BY DATE(recorded_at)
      ORDER BY date DESC
      `,
      [projectId, startDate, endDate]
    )

    const breakdownByDay = breakdownResult.rows.map(row => ({
      date: row.date,
      uploadCount: parseInt(row.upload_count) || 0,
      downloadCount: parseInt(row.download_count) || 0,
      bytesTransferred: parseInt(row.bytes_transferred) || 0,
    }))

    return {
      success: true,
      data: {
        uploadCount,
        downloadCount,
        bytesTransferred,
        breakdownByDay,
      },
    }
  } catch (error: any) {
    console.error('[StorageUsageTracking] Error getting storage usage stats:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get current storage usage for quota checking
 *
 * Returns usage counts for the current billing period (last 30 days).
 *
 * @param projectId - The project ID
 * @returns Current usage counts
 */
export async function getCurrentStorageUsage(
  projectId: string
): Promise<{
  success: boolean
  data?: {
    uploadCount: number
    downloadCount: number
    bytesTransferred: number
  }
  error?: string
}> {
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
