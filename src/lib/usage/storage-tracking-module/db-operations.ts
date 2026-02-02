/**
 * Storage Usage Tracking - Module - Database Operations
 */

import { getPool } from '@/lib/db'
import type { StorageUsageMetric } from '../types'
import { SERVICE_NAME } from '../constants'

export async function insertMetric(metric: StorageUsageMetric): Promise<void> {
  const pool = getPool()

  await pool.query(
    `
    INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
    VALUES ($1, $2, $3, $4, NOW())
    `,
    [metric.projectId, SERVICE_NAME, metric.metricType, metric.quantity]
  )
}

export async function insertMetrics(metrics: StorageUsageMetric[]): Promise<void> {
  const pool = getPool()

  // Build values array for bulk insert
  const values: any[] = []
  const placeholders: string[] = []

  metrics.forEach((metric, index) => {
    const baseIndex = index * 3
    values.push(metric.projectId, metric.metricType, metric.quantity)
    placeholders.push(`($${baseIndex + 1}, '${SERVICE_NAME}', $${baseIndex + 2}, $${baseIndex + 3}, NOW())`)
  })

  await pool.query(
    `
    INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
    VALUES ${placeholders.join(', ')}
    `,
    values
  )
}

export async function getAggregatedStats(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  uploadCount: number
  downloadCount: number
  bytesTransferred: number
}> {
  const pool = getPool()

  const result = await pool.query(
    `
    SELECT
      SUM(CASE WHEN metric_type = 'storage_upload' THEN quantity ELSE 0 END) as upload_count,
      SUM(CASE WHEN metric_type = 'storage_download' THEN quantity ELSE 0 END) as download_count,
      SUM(CASE WHEN metric_type = 'storage_bytes' THEN quantity ELSE 0 END) as bytes_transferred
    FROM control_plane.usage_metrics
    WHERE project_id = $1
      AND service = $2
      AND recorded_at >= $3
      AND recorded_at <= $4
    `,
    [projectId, SERVICE_NAME, startDate, endDate]
  )

  const row = result.rows[0]
  return {
    uploadCount: parseInt(row.upload_count) || 0,
    downloadCount: parseInt(row.download_count) || 0,
    bytesTransferred: parseInt(row.bytes_transferred) || 0,
  }
}

export async function getDailyBreakdown(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{
  date: string
  uploadCount: number
  downloadCount: number
  bytesTransferred: number
}>> {
  const pool = getPool()

  const result = await pool.query(
    `
    SELECT
      DATE(recorded_at) as date,
      SUM(CASE WHEN metric_type = 'storage_upload' THEN quantity ELSE 0 END) as upload_count,
      SUM(CASE WHEN metric_type = 'storage_download' THEN quantity ELSE 0 END) as download_count,
      SUM(CASE WHEN metric_type = 'storage_bytes' THEN quantity ELSE 0 END) as bytes_transferred
    FROM control_plane.usage_metrics
    WHERE project_id = $1
      AND service = $2
      AND recorded_at >= $3
      AND recorded_at <= $4
    GROUP BY DATE(recorded_at)
    ORDER BY date DESC
    `,
    [projectId, SERVICE_NAME, startDate, endDate]
  )

  return result.rows.map(row => ({
    date: row.date,
    uploadCount: parseInt(row.upload_count) || 0,
    downloadCount: parseInt(row.download_count) || 0,
    bytesTransferred: parseInt(row.bytes_transferred) || 0,
  }))
}
