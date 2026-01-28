import { getPool } from '@/lib/db'

/**
 * Migration: Create error_metrics table
 *
 * This table stores error metrics for projects to enable error rate detection.
 * Metrics are recorded at regular intervals to track error patterns over time.
 */
export async function createErrorMetricsTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'error_metrics'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the error_metrics table
      await pool.query(`
        CREATE TABLE error_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          request_count BIGINT NOT NULL CHECK (request_count >= 0),
          error_count BIGINT NOT NULL CHECK (error_count >= 0),
          recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      console.log('[Migration] Created error_metrics table')

      // Create composite index for efficient time-series queries
      // This is the primary index for error rate detection queries
      await pool.query(`
        CREATE INDEX idx_error_metrics_project_time
        ON error_metrics(project_id, recorded_at DESC)
      `)

      console.log('[Migration] Created composite index on (project_id, recorded_at)')

      // Create index on recorded_at for time-range queries
      await pool.query(`
        CREATE INDEX idx_error_metrics_recorded_at
        ON error_metrics(recorded_at DESC)
      `)

      console.log('[Migration] Created index on error_metrics.recorded_at')

      // Create index on project_id for project-specific queries
      await pool.query(`
        CREATE INDEX idx_error_metrics_project_id
        ON error_metrics(project_id)
      `)

      console.log('[Migration] Created index on error_metrics.project_id')
    } else {
      console.log('[Migration] error_metrics table already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating error_metrics table:', error)
    return { success: false, error }
  }
}

/**
 * Record error metrics for a project
 *
 * @param projectId - The project ID
 * @param requestCount - The number of requests
 * @param errorCount - The number of errors
 */
export async function recordErrorMetrics(
  projectId: string,
  requestCount: number,
  errorCount: number
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO error_metrics (project_id, request_count, error_count)
      VALUES ($1, $2, $3)
      `,
      [projectId, requestCount, errorCount]
    )

    console.log(
      `[Error Metrics] Recorded metrics for project ${projectId}: ${requestCount} requests, ${errorCount} errors`
    )

    return { success: true }
  } catch (error) {
    console.error('[Error Metrics] Error recording metrics:', error)
    return { success: false, error }
  }
}

/**
 * Get error metrics for a project within a time range
 *
 * @param projectId - The project ID
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getErrorMetrics(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<{
  success: boolean
  data?: Array<{ recorded_at: Date; request_count: number; error_count: number }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT recorded_at, request_count, error_count
      FROM error_metrics
      WHERE project_id = $1
        AND recorded_at >= $2
        AND recorded_at <= $3
      ORDER BY recorded_at ASC
      `,
      [projectId, startTime, endTime]
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Error Metrics] Error querying metrics:', error)
    return { success: false, error }
  }
}

/**
 * Get aggregated error statistics for a project
 *
 * @param projectId - The project ID
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getErrorStatistics(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<{
  success: boolean
  data?: { totalRequests: number; totalErrors: number; errorRate: number }
  error?: unknown
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(request_count), 0) as total_requests,
        COALESCE(SUM(error_count), 0) as total_errors
      FROM error_metrics
      WHERE project_id = $1
        AND recorded_at >= $2
        AND recorded_at <= $3
      `,
      [projectId, startTime, endTime]
    )

    const totalRequests = parseInt(result.rows[0].total_requests)
    const totalErrors = parseInt(result.rows[0].total_errors)
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

    return { success: true, data: { totalRequests, totalErrors, errorRate } }
  } catch (error) {
    console.error('[Error Metrics] Error calculating statistics:', error)
    return { success: false, error }
  }
}

/**
 * Clean up old error metrics to prevent table bloat
 *
 * @param retentionDays - Number of days to retain metrics (default: 30)
 */
export async function cleanupOldErrorMetrics(retentionDays: number = 30): Promise<{
  success: boolean
  deletedCount?: number
  error?: unknown
}> {
  const pool = getPool()

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const result = await pool.query(
      `
      DELETE FROM error_metrics
      WHERE recorded_at < $1
      `,
      [cutoffDate]
    )

    const deletedCount = result.rowCount || 0

    console.log(
      `[Error Metrics] Cleaned up ${deletedCount} old metric records (older than ${retentionDays} days)`
    )

    return { success: true, deletedCount }
  } catch (error) {
    console.error('[Error Metrics] Error cleaning up old metrics:', error)
    return { success: false, error }
  }
}
