/**
 * Database Usage Tracking Service
 *
 * Tracks database usage metrics for quota enforcement and billing:
 * - db_query: Number of database queries executed
 * - db_row_read: Number of rows read from database
 * - db_row_written: Number of rows written/updated/deleted
 *
 * All tracking is done asynchronously (fire-and-forget) to avoid blocking requests.
 *
 * US-002 from prd-usage-tracking.json
 */

import { getPool } from '@/lib/db'

export type DatabaseMetricType = 'db_query' | 'db_row_read' | 'db_row_written'

export interface DatabaseUsageMetric {
  projectId: string
  metricType: DatabaseMetricType
  quantity: number
}

/**
 * Record a database usage metric
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
 * recordDatabaseMetric({
 *   projectId: 'abc-123',
 *   metricType: 'db_query',
 *   quantity: 1
 * }).catch(err => console.error('Failed to record metric:', err))
 */
export async function recordDatabaseMetric(
  metric: DatabaseUsageMetric
): Promise<void> {
  const { projectId, metricType, quantity } = metric

  // Validate inputs
  if (!projectId) {
    console.error('[DatabaseUsageTracking] Missing projectId')
    return
  }

  if (!['db_query', 'db_row_read', 'db_row_written'].includes(metricType)) {
    console.error('[DatabaseUsageTracking] Invalid metricType:', metricType)
    return
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    console.error('[DatabaseUsageTracking] Invalid quantity:', quantity)
    return
  }

  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ($1, 'database', $2, $3, NOW())
      `,
      [projectId, metricType, quantity]
    )

    // Debug logging (can be disabled in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DatabaseUsageTracking] Recorded: ${metricType} = ${quantity} for project ${projectId}`)
    }
  } catch (error: any) {
    // Don't throw - this is a fire-and-forget operation
    console.error('[DatabaseUsageTracking] Failed to record metric:', {
      projectId,
      metricType,
      quantity,
      error: error.message,
    })
  }
}

/**
 * Record multiple database metrics in a single query
 *
 * More efficient than recording metrics individually when you have
 * multiple metrics to track for a single request.
 *
 * @param metrics - Array of metrics to record
 * @returns Promise that resolves when recording is complete
 *
 * @example
 * // Fire and forget
 * recordDatabaseMetrics([
 *   { projectId: 'abc-123', metricType: 'db_query', quantity: 1 },
 *   { projectId: 'abc-123', metricType: 'db_row_read', quantity: 50 }
 * ]).catch(err => console.error('Failed to record metrics:', err))
 */
export async function recordDatabaseMetrics(
  metrics: DatabaseUsageMetric[]
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
      placeholders.push(`($${baseIndex + 1}, 'database', $${baseIndex + 2}, $${baseIndex + 3}, NOW())`)
    })

    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ${placeholders.join(', ')}
      `,
      values
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DatabaseUsageTracking] Recorded ${metrics.length} metrics`)
    }
  } catch (error: any) {
    console.error('[DatabaseUsageTracking] Failed to record metrics:', {
      metricCount: metrics.length,
      error: error.message,
    })
  }
}

/**
 * Track database query execution
 *
 * Convenience function for recording a single database query.
 *
 * @param projectId - The project ID
 * @param rowsRead - Number of rows read (default: 0)
 * @param rowsWritten - Number of rows written (default: 0)
 *
 * @example
 * // Fire and forget
 * trackDatabaseQuery('abc-123', 10, 0)
 */
export function trackDatabaseQuery(
  projectId: string,
  rowsRead: number = 0,
  rowsWritten: number = 0
): void {
  // Don't await - fire and forget
  recordDatabaseMetrics([
    { projectId, metricType: 'db_query', quantity: 1 },
    { projectId, metricType: 'db_row_read', quantity: rowsRead },
    { projectId, metricType: 'db_row_written', quantity: rowsWritten },
  ]).catch(err => {
    // Silent fail - logging errors in the recording function
  })
}

/**
 * Get database usage statistics for a project
 *
 * Aggregates database metrics for a project within a time range.
 *
 * @param projectId - The project ID
 * @param startDate - Start date for aggregation (default: 30 days ago)
 * @param endDate - End date for aggregation (default: now)
 * @returns Aggregated database usage statistics
 */
export async function getDatabaseUsageStats(
  projectId: string,
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: Date = new Date()
): Promise<{
  success: boolean
  data?: {
    dbQueryCount: number
    dbRowReadCount: number
    dbRowWrittenCount: number
    breakdownByDay: Array<{
      date: string
      dbQueryCount: number
      dbRowReadCount: number
      dbRowWrittenCount: number
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
        SUM(CASE WHEN metric_type = 'db_query' THEN quantity ELSE 0 END) as db_query_count,
        SUM(CASE WHEN metric_type = 'db_row_read' THEN quantity ELSE 0 END) as db_row_read_count,
        SUM(CASE WHEN metric_type = 'db_row_written' THEN quantity ELSE 0 END) as db_row_written_count
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'database'
        AND recorded_at >= $2
        AND recorded_at <= $3
      `,
      [projectId, startDate, endDate]
    )

    const row = result.rows[0]
    const dbQueryCount = parseInt(row.db_query_count) || 0
    const dbRowReadCount = parseInt(row.db_row_read_count) || 0
    const dbRowWrittenCount = parseInt(row.db_row_written_count) || 0

    // Get breakdown by day
    const breakdownResult = await pool.query(
      `
      SELECT
        DATE(recorded_at) as date,
        SUM(CASE WHEN metric_type = 'db_query' THEN quantity ELSE 0 END) as db_query_count,
        SUM(CASE WHEN metric_type = 'db_row_read' THEN quantity ELSE 0 END) as db_row_read_count,
        SUM(CASE WHEN metric_type = 'db_row_written' THEN quantity ELSE 0 END) as db_row_written_count
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'database'
        AND recorded_at >= $2
        AND recorded_at <= $3
      GROUP BY DATE(recorded_at)
      ORDER BY date DESC
      `,
      [projectId, startDate, endDate]
    )

    const breakdownByDay = breakdownResult.rows.map(row => ({
      date: row.date,
      dbQueryCount: parseInt(row.db_query_count) || 0,
      dbRowReadCount: parseInt(row.db_row_read_count) || 0,
      dbRowWrittenCount: parseInt(row.db_row_written_count) || 0,
    }))

    return {
      success: true,
      data: {
        dbQueryCount,
        dbRowReadCount,
        dbRowWrittenCount,
        breakdownByDay,
      },
    }
  } catch (error: any) {
    console.error('[DatabaseUsageTracking] Error getting database usage stats:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get current database usage for quota checking
 *
 * Returns usage counts for the current billing period (last 30 days).
 *
 * @param projectId - The project ID
 * @returns Current usage counts
 */
export async function getCurrentDatabaseUsage(
  projectId: string
): Promise<{
  success: boolean
  data?: {
    dbQueryCount: number
    dbRowReadCount: number
    dbRowWrittenCount: number
  }
  error?: string
}> {
  const stats = await getDatabaseUsageStats(projectId)

  if (!stats.success || !stats.data) {
    return stats
  }

  return {
    success: true,
    data: {
      dbQueryCount: stats.data.dbQueryCount,
      dbRowReadCount: stats.data.dbRowReadCount,
      dbRowWrittenCount: stats.data.dbRowWrittenCount,
    },
  }
}
