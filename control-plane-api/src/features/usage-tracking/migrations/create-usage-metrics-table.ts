import { getPool } from '@/lib/db'

/**
 * Migration: Create usage_metrics table for Usage Tracking
 *
 * This table stores usage metrics for projects to enable quota enforcement,
 * billing, and usage tracking across all platform services.
 *
 * Per the PRD requirements:
 * - Columns: id, project_id, service, metric_type, quantity, recorded_at
 * - Metric types: db_query, db_row_read, db_row_written, realtime_message,
 *   realtime_connection, storage_upload, storage_download, storage_bytes,
 *   auth_signup, auth_signin, function_invocation
 */
export async function createUsageMetricsTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'usage_metrics'
        AND table_schema = 'control_plane'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the usage_metrics table in control_plane schema
      await pool.query(`
        CREATE TABLE control_plane.usage_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES control_plane.projects(id) ON DELETE CASCADE,
          service VARCHAR(50) NOT NULL,
          metric_type VARCHAR(50) NOT NULL,
          quantity BIGINT NOT NULL CHECK (quantity >= 0),
          recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      console.log('[Migration] Created usage_metrics table in control_plane schema')

      // Create composite index for efficient aggregation queries
      // This is the primary index for usage aggregation per PRD requirement
      await pool.query(`
        CREATE INDEX idx_usage_metrics_project_service_recorded
        ON control_plane.usage_metrics(project_id, service, recorded_at DESC)
      `)

      console.log('[Migration] Created composite index on (project_id, service, recorded_at)')

      // Create index on recorded_at for time-range queries
      await pool.query(`
        CREATE INDEX idx_usage_metrics_recorded_at
        ON control_plane.usage_metrics(recorded_at DESC)
      `)

      console.log('[Migration] Created index on usage_metrics.recorded_at')

      // Create index on project_id for project-specific queries
      await pool.query(`
        CREATE INDEX idx_usage_metrics_project_id
        ON control_plane.usage_metrics(project_id)
      `)

      console.log('[Migration] Created index on usage_metrics.project_id')

      // Add check constraint for valid services
      await pool.query(`
        ALTER TABLE control_plane.usage_metrics
        ADD CONSTRAINT usage_metrics_service_check
        CHECK (service IN (
          'database',
          'realtime',
          'storage',
          'auth',
          'functions'
        ))
      `)

      console.log('[Migration] Added service check constraint')

      // Add check constraint for valid metric types
      await pool.query(`
        ALTER TABLE control_plane.usage_metrics
        ADD CONSTRAINT usage_metrics_metric_type_check
        CHECK (metric_type IN (
          'db_query',
          'db_row_read',
          'db_row_written',
          'realtime_message',
          'realtime_connection',
          'storage_upload',
          'storage_download',
          'storage_bytes',
          'auth_signup',
          'auth_signin',
          'function_invocation'
        ))
      `)

      console.log('[Migration] Added metric_type check constraint')

      // Add comments for documentation
      await pool.query(`
        COMMENT ON TABLE control_plane.usage_metrics IS 'Tracks resource consumption metrics for quota enforcement and billing'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.usage_metrics.service IS 'Service name: database, realtime, storage, auth, functions'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.usage_metrics.metric_type IS 'Type of metric: db_query, db_row_read, db_row_written, realtime_message, realtime_connection, storage_upload, storage_download, storage_bytes, auth_signup, auth_signin, function_invocation'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.usage_metrics.quantity IS 'Quantity of the metric consumed'
      `)

      await pool.query(`
        COMMENT ON COLUMN control_plane.usage_metrics.recorded_at IS 'Timestamp when the metric was recorded'
      `)

      console.log('[Migration] Added table and column comments')
    } else {
      console.log('[Migration] usage_metrics table already exists in control_plane schema')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating usage_metrics table:', error)
    return { success: false, error }
  }
}

/**
 * Record a usage metric for a project
 *
 * @param projectId - The project ID
 * @param service - The service name (database, realtime, storage, auth, functions)
 * @param metricType - The type of metric being recorded
 * @param quantity - The quantity of the metric
 */
export async function recordUsageMetric(
  projectId: string,
  service: string,
  metricType: string,
  quantity: number
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity)
      VALUES ($1, $2, $3, $4)
      `,
      [projectId, service, metricType, quantity]
    )

    console.log(
      `[Usage Metrics] Recorded metric for project ${projectId}: ${service}.${metricType} = ${quantity}`
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
 * @param service - Optional service filter
 * @param metricType - Optional metric type filter
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getUsageMetrics(
  projectId: string,
  startTime: Date,
  endTime: Date,
  service?: string,
  metricType?: string
): Promise<{ success: boolean; data?: Array<{ recorded_at: Date; service: string; metric_type: string; quantity: number }>; error?: unknown }> {
  const pool = getPool()

  try {
    let query = `
      SELECT recorded_at, service, metric_type, quantity
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND recorded_at >= $2
        AND recorded_at <= $3
    `
    const params: any[] = [projectId, startTime, endTime]
    let paramIndex = 4

    if (service) {
      query += ` AND service = $${paramIndex}`
      params.push(service)
      paramIndex++
    }

    if (metricType) {
      query += ` AND metric_type = $${paramIndex}`
      params.push(metricType)
      paramIndex++
    }

    query += ` ORDER BY recorded_at ASC`

    const result = await pool.query(query, params)

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
 * @param service - Optional service filter
 * @param metricType - Optional metric type filter
 * @param startTime - Start of time range
 * @param endTime - End of time range
 * @param aggregation - Aggregation type: day, week, month (optional)
 */
export async function getAggregatedUsage(
  projectId: string,
  startTime: Date,
  endTime: Date,
  service?: string,
  metricType?: string,
  aggregation?: 'day' | 'week' | 'month'
): Promise<{
  success: boolean
  data?: Array<{ period: Date; service: string; metric_type: string; total: number }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    let query = `
      SELECT
    `

    // Add time truncation based on aggregation
    if (aggregation === 'day') {
      query += ` DATE_TRUNC('day', recorded_at) as period,`
    } else if (aggregation === 'week') {
      query += ` DATE_TRUNC('week', recorded_at) as period,`
    } else if (aggregation === 'month') {
      query += ` DATE_TRUNC('month', recorded_at) as period,`
    } else {
      query += ` recorded_at as period,`
    }

    query += `
        service,
        metric_type,
        SUM(quantity) as total
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND recorded_at >= $2
        AND recorded_at <= $3
    `

    const params: any[] = [projectId, startTime, endTime]
    let paramIndex = 4

    if (service) {
      query += ` AND service = $${paramIndex}`
      params.push(service)
      paramIndex++
    }

    if (metricType) {
      query += ` AND metric_type = $${paramIndex}`
      params.push(metricType)
      paramIndex++
    }

    query += ` GROUP BY period, service, metric_type ORDER BY period ASC`

    const result = await pool.query(query, params)

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Usage Metrics] Error aggregating usage:', error)
    return { success: false, error }
  }
}

/**
 * Get total usage for a project (current period)
 *
 * @param projectId - The project ID
 * @param service - Optional service filter
 * @param metricType - Optional metric type filter
 * @param periodStart - Start of the period (e.g., beginning of month)
 */
export async function getCurrentUsage(
  projectId: string,
  periodStart: Date,
  service?: string,
  metricType?: string
): Promise<{
  success: boolean
  data?: Array<{ service: string; metric_type: string; total: number }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    let query = `
      SELECT
        service,
        metric_type,
        SUM(quantity) as total
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND recorded_at >= $2
    `

    const params: any[] = [projectId, periodStart]
    let paramIndex = 3

    if (service) {
      query += ` AND service = $${paramIndex}`
      params.push(service)
      paramIndex++
    }

    if (metricType) {
      query += ` AND metric_type = $${paramIndex}`
      params.push(metricType)
      paramIndex++
    }

    query += ` GROUP BY service, metric_type`

    const result = await pool.query(query, params)

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Usage Metrics] Error getting current usage:', error)
    return { success: false, error }
  }
}

/**
 * Clean up old usage metrics to prevent table bloat
 *
 * @param retentionDays - Number of days to retain metrics (default: 90 days for billing)
 */
export async function cleanupOldUsageMetrics(retentionDays: number = 90): Promise<{
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
      DELETE FROM control_plane.usage_metrics
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
