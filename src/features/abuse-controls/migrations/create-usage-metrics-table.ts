import { getPool } from '@/lib/db'

/**
 * Migration: Create usage_metrics table
 *
 * This table stores usage metrics for projects to enable spike detection.
 * Metrics are recorded at regular intervals to track usage patterns over time.
 */
export async function createUsageMetricsTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'usage_metrics'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the usage_metrics table
      await pool.query(`
        CREATE TABLE usage_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          metric_type VARCHAR(50) NOT NULL,
          metric_value BIGINT NOT NULL CHECK (metric_value >= 0),
          recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      console.log('[Migration] Created usage_metrics table')

      // Create composite index for efficient time-series queries
      // This is the primary index for spike detection queries
      await pool.query(`
        CREATE INDEX idx_usage_metrics_project_type_time
        ON usage_metrics(project_id, metric_type, recorded_at DESC)
      `)

      console.log('[Migration] Created composite index on (project_id, metric_type, recorded_at)')

      // Create index on recorded_at for time-range queries
      await pool.query(`
        CREATE INDEX idx_usage_metrics_recorded_at
        ON usage_metrics(recorded_at DESC)
      `)

      console.log('[Migration] Created index on usage_metrics.recorded_at')

      // Create index on project_id for project-specific queries
      await pool.query(`
        CREATE INDEX idx_usage_metrics_project_id
        ON usage_metrics(project_id)
      `)

      console.log('[Migration] Created index on usage_metrics.project_id')
    } else {
      console.log('[Migration] usage_metrics table already exists')
    }

    // Ensure metric_type has proper check constraints
    await ensureMetricTypeCheck(pool)

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating usage_metrics table:', error)
    return { success: false, error }
  }
}

/**
 * Ensure metric_type has proper check constraints
 */
async function ensureMetricTypeCheck(pool: any) {
  try {
    // Check if check constraint exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint
        WHERE conname = 'usage_metrics_metric_type_check'
      )
    `)

    const constraintExists = checkResult.rows[0].exists

    if (!constraintExists) {
      // Add check constraint for valid metric types
      await pool.query(`
        ALTER TABLE usage_metrics
        ADD CONSTRAINT usage_metrics_metric_type_check
        CHECK (metric_type IN (
          'db_queries_per_day',
          'realtime_connections',
          'storage_uploads_per_day',
          'function_invocations_per_day'
        ))
      `)

      console.log('[Migration] Added metric_type check constraint')
    }
  } catch (error) {
    console.error('[Migration] Error adding metric_type constraint:', error)
    throw error
  }
}

/**
 * Record a usage metric for a project
 *
 * @param projectId - The project ID
 * @param metricType - The type of metric being recorded
 * @param metricValue - The value of the metric
 */
export async function recordUsageMetric(
  projectId: string,
  metricType: string,
  metricValue: number
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO usage_metrics (project_id, metric_type, metric_value)
      VALUES ($1, $2, $3)
      `,
      [projectId, metricType, metricValue]
    )

    console.log(
      `[Usage Metrics] Recorded metric for project ${projectId}: ${metricType} = ${metricValue}`
    )

    return { success: true }
  } catch (error) {
    console.error('[Usage Metrics] Error recording metric:', error)
    return { success: false, error }
  }
}

/**
 * Get usage metrics for a project within a time range
 *
 * @param projectId - The project ID
 * @param metricType - The type of metric to query
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getUsageMetrics(
  projectId: string,
  metricType: string,
  startTime: Date,
  endTime: Date
): Promise<{ success: boolean; data?: Array<{ recorded_at: Date; metric_value: number }>; error?: unknown }> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT recorded_at, metric_value
      FROM usage_metrics
      WHERE project_id = $1
        AND metric_type = $2
        AND recorded_at >= $3
        AND recorded_at <= $4
      ORDER BY recorded_at ASC
      `,
      [projectId, metricType, startTime, endTime]
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Usage Metrics] Error querying metrics:', error)
    return { success: false, error }
  }
}

/**
 * Get aggregated usage statistics for a project
 *
 * @param projectId - The project ID
 * @param metricType - The type of metric to aggregate
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getUsageStatistics(
  projectId: string,
  metricType: string,
  startTime: Date,
  endTime: Date
): Promise<{
  success: boolean
  data?: { total: number; average: number; min: number; max: number; count: number }
  error?: unknown
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(metric_value), 0) as total,
        COALESCE(AVG(metric_value), 0) as average,
        COALESCE(MIN(metric_value), 0) as min,
        COALESCE(MAX(metric_value), 0) as max,
        COUNT(*) as count
      FROM usage_metrics
      WHERE project_id = $1
        AND metric_type = $2
        AND recorded_at >= $3
        AND recorded_at <= $4
      `,
      [projectId, metricType, startTime, endTime]
    )

    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error('[Usage Metrics] Error calculating statistics:', error)
    return { success: false, error }
  }
}

/**
 * Clean up old usage metrics to prevent table bloat
 *
 * @param retentionDays - Number of days to retain metrics (default: 30)
 */
export async function cleanupOldUsageMetrics(retentionDays: number = 30): Promise<{
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
      DELETE FROM usage_metrics
      WHERE recorded_at < $1
      `,
      [cutoffDate]
    )

    const deletedCount = result.rowCount || 0

    console.log(
      `[Usage Metrics] Cleaned up ${deletedCount} old metric records (older than ${retentionDays} days)`
    )

    return { success: true, deletedCount }
  } catch (error) {
    console.error('[Usage Metrics] Error cleaning up old metrics:', error)
    return { success: false, error }
  }
}
