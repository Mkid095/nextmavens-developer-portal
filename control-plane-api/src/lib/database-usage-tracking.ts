/**
 * US-002: Track Database Usage
 *
 * This module provides database usage tracking for the API gateway.
 * Tracks db_query count, db_row_read count, and db_row_written count.
 * Records to usage_metrics table asynchronously to not block requests.
 *
 * Acceptance Criteria:
 * - API gateway logs db_query count
 * - Logs db_row_read count
 * - Logs db_row_written count
 * - Records to usage_metrics table
 * - Async to not block requests
 */

import { getPool } from './db'

/**
 * Database metric types that can be tracked
 */
export enum DatabaseMetricType {
  DB_QUERY = 'db_query',
  DB_ROW_READ = 'db_row_read',
  DB_ROW_WRITTEN = 'db_row_written',
}

/**
 * Database usage metrics for a single request
 */
export interface DatabaseUsageMetrics {
  projectId: string
  queryCount: number
  rowsRead: number
  rowsWritten: number
}

/**
 * Result of a database query with usage tracking
 */
export interface TrackedQueryResult<T = any> {
  data: T[]
  usage: {
    queryCount: number
    rowsRead: number
    rowsWritten: number
  }
}

/**
 * Record a single database usage metric to the usage_metrics table
 *
 * @param projectId - The project ID to attribute usage to
 * @param metricType - The type of metric (db_query, db_row_read, db_row_written)
 * @param quantity - The quantity to record (typically 1 for queries, actual count for rows)
 */
export async function recordDatabaseUsage(
  projectId: string,
  metricType: DatabaseMetricType,
  quantity: number
): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `INSERT INTO control_plane.usage_metrics
       (project_id, service, metric_type, quantity, recorded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [projectId, 'database', metricType, quantity]
    )
  } catch (error) {
    // Don't throw - logging failure shouldn't break requests
    console.error('[DatabaseUsageTracking] Failed to record usage:', {
      projectId,
      metricType,
      quantity,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Record multiple database usage metrics in a single query
 *
 * @param metrics - Array of usage metrics to record
 */
export async function recordDatabaseUsageBatch(
  metrics: Array<{ projectId: string; metricType: DatabaseMetricType; quantity: number }>
): Promise<void> {
  if (metrics.length === 0) {
    return
  }

  const pool = getPool()

  try {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      for (const metric of metrics) {
        await client.query(
          `INSERT INTO control_plane.usage_metrics
           (project_id, service, metric_type, quantity, recorded_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [metric.projectId, 'database', metric.metricType, metric.quantity]
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    // Don't throw - logging failure shouldn't break requests
    console.error('[DatabaseUsageTracking] Failed to record usage batch:', {
      metricCount: metrics.length,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Record database usage metrics asynchronously (fire-and-forget)
 *
 * This function logs usage without awaiting the result, ensuring it doesn't block
 * the request response. Errors are logged but don't affect the request.
 *
 * @param metrics - The usage metrics to record
 */
export function recordDatabaseUsageAsync(
  metrics: DatabaseUsageMetrics
): void {
  // Fire and forget - don't await
  recordDatabaseUsageBatch([
    { projectId: metrics.projectId, metricType: DatabaseMetricType.DB_QUERY, quantity: metrics.queryCount },
    { projectId: metrics.projectId, metricType: DatabaseMetricType.DB_ROW_READ, quantity: metrics.rowsRead },
    { projectId: metrics.projectId, metricType: DatabaseMetricType.DB_ROW_WRITTEN, quantity: metrics.rowsWritten },
  ]).catch((error) => {
    // Already logged in recordDatabaseUsageBatch, but log here too for visibility
    console.error('[DatabaseUsageTracking] Async recording failed:', error)
  })
}

/**
 * Extract row counts from a PostgreSQL query result
 *
 * @param result - The query result from pg.Pool#query
 * @returns Object with rowsRead and rowsWritten counts
 */
export function extractRowCounts(result: { rowCount: number | null; command: string }): {
  rowsRead: number
  rowsWritten: number
} {
  const rowsRead = result.rowCount || 0

  // Determine if this was a write operation
  const command = result.command.toUpperCase()
  const isWriteOperation = ['INSERT', 'UPDATE', 'DELETE', 'COPY'].includes(command)

  return {
    rowsRead,
    rowsWritten: isWriteOperation ? rowsRead : 0,
  }
}

/**
 * Wrap a database query with automatic usage tracking
 *
 * @param projectId - The project ID to attribute usage to
 * @param queryFn - Function that executes the database query
 * @returns The query result along with usage metrics
 */
export async function withDatabaseUsageTracking<T>(
  projectId: string,
  queryFn: () => Promise<{ rowCount: number | null; command: string; rows?: T[] }>
): Promise<TrackedQueryResult<T>> {
  const startTime = Date.now()

  // Execute the query
  const result = await queryFn()

  // Extract usage metrics
  const { rowsRead, rowsWritten } = extractRowCounts(result)

  const usage: DatabaseUsageMetrics = {
    projectId,
    queryCount: 1,
    rowsRead,
    rowsWritten,
  }

  // Record usage asynchronously (fire-and-forget)
  recordDatabaseUsageAsync(usage)

  return {
    data: result.rows || [],
    usage: {
      queryCount: 1,
      rowsRead,
      rowsWritten,
    },
  }
}

/**
 * Aggregate database usage for a project over a time period
 *
 * @param projectId - The project ID
 * @param startDate - Start of the time period
 * @param endDate - End of the time period
 * @returns Aggregated usage metrics
 */
export async function getDatabaseUsageStats(
  projectId: string,
  startDate: Date,
  endDate: Date = new Date()
): Promise<{
  totalQueries: number
  totalRowsRead: number
  totalRowsWritten: number
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `SELECT
         metric_type,
         SUM(quantity) as total
       FROM control_plane.usage_metrics
       WHERE project_id = $1
         AND service = 'database'
         AND recorded_at >= $2
         AND recorded_at <= $3
       GROUP BY metric_type`,
      [projectId, startDate, endDate]
    )

    const stats = {
      totalQueries: 0,
      totalRowsRead: 0,
      totalRowsWritten: 0,
    }

    for (const row of result.rows) {
      switch (row.metric_type) {
        case DatabaseMetricType.DB_QUERY:
          stats.totalQueries = parseInt(row.total, 10)
          break
        case DatabaseMetricType.DB_ROW_READ:
          stats.totalRowsRead = parseInt(row.total, 10)
          break
        case DatabaseMetricType.DB_ROW_WRITTEN:
          stats.totalRowsWritten = parseInt(row.total, 10)
          break
      }
    }

    return stats
  } catch (error) {
    console.error('[DatabaseUsageTracking] Failed to get usage stats:', {
      projectId,
      startDate,
      endDate,
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      totalQueries: 0,
      totalRowsRead: 0,
      totalRowsWritten: 0,
    }
  }
}
