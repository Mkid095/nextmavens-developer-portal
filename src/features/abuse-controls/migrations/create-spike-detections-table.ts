import { getPool } from '@/lib/db'

/**
 * Migration: Create spike_detections table
 *
 * This table logs all detected usage spikes for audit and analysis.
 * Each record represents a detected anomaly with details about the spike.
 */
export async function createSpikeDetectionsTable() {
  const pool = getPool()

  try {
    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'spike_detections'
      )
    `)

    const tableExists = checkResult.rows[0].exists

    if (!tableExists) {
      // Create the spike_detections table
      await pool.query(`
        CREATE TABLE spike_detections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          metric_type VARCHAR(50) NOT NULL,
          current_value BIGINT NOT NULL,
          average_value DECIMAL(15,2) NOT NULL,
          multiplier DECIMAL(5,2) NOT NULL,
          severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'critical', 'severe')),
          action_taken VARCHAR(20) NOT NULL CHECK (action_taken IN ('none', 'warning', 'suspension')),
          detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      console.log('[Migration] Created spike_detections table')

      // Create index on project_id for project-specific queries
      await pool.query(`
        CREATE INDEX idx_spike_detections_project_id
        ON spike_detections(project_id)
      `)

      console.log('[Migration] Created index on spike_detections.project_id')

      // Create composite index for time-series queries
      await pool.query(`
        CREATE INDEX idx_spike_detections_project_metric_time
        ON spike_detections(project_id, metric_type, detected_at DESC)
      `)

      console.log('[Migration] Created composite index on (project_id, metric_type, detected_at)')

      // Create index on detected_at for time-range queries
      await pool.query(`
        CREATE INDEX idx_spike_detections_detected_at
        ON spike_detections(detected_at DESC)
      `)

      console.log('[Migration] Created index on spike_detections.detected_at')

      // Create index on severity for filtering by severity level
      await pool.query(`
        CREATE INDEX idx_spike_detections_severity
        ON spike_detections(severity)
      `)

      console.log('[Migration] Created index on spike_detections.severity')

      // Create index on action_taken for filtering by action type
      await pool.query(`
        CREATE INDEX idx_spike_detections_action_taken
        ON spike_detections(action_taken)
      `)

      console.log('[Migration] Created index on spike_detections.action_taken')
    } else {
      console.log('[Migration] spike_detections table already exists')
    }

    // Ensure metric_type has proper check constraints
    await ensureMetricTypeCheck(pool)

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error creating spike_detections table:', error)
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
        WHERE conname = 'spike_detections_metric_type_check'
      )
    `)

    const constraintExists = checkResult.rows[0].exists

    if (!constraintExists) {
      // Add check constraint for valid metric types
      await pool.query(`
        ALTER TABLE spike_detections
        ADD CONSTRAINT spike_detections_metric_type_check
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
 * Log a detected spike
 *
 * @param projectId - The project ID
 * @param metricType - The type of metric that spiked
 * @param currentValue - The current metric value
 * @param averageValue - The average baseline value
 * @param multiplier - The multiplier (current / average)
 * @param severity - The severity level
 * @param actionTaken - The action that was taken
 */
export async function logSpikeDetection(
  projectId: string,
  metricType: string,
  currentValue: number,
  averageValue: number,
  multiplier: number,
  severity: string,
  actionTaken: string
): Promise<{ success: boolean; error?: unknown }> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO spike_detections (
        project_id,
        metric_type,
        current_value,
        average_value,
        multiplier,
        severity,
        action_taken
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [projectId, metricType, currentValue, averageValue, multiplier, severity, actionTaken]
    )

    console.log(
      `[Spike Detection] Logged spike for project ${projectId}: ${metricType} = ${currentValue} (${multiplier}x average)`
    )

    return { success: true }
  } catch (error) {
    console.error('[Spike Detection] Error logging spike:', error)
    return { success: false, error }
  }
}

/**
 * Get spike detections for a project within a time range
 *
 * @param projectId - The project ID
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getSpikeDetections(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    project_id: string
    metric_type: string
    current_value: number
    average_value: number
    multiplier: number
    severity: string
    action_taken: string
    detected_at: Date
  }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        metric_type,
        current_value,
        average_value,
        multiplier,
        severity,
        action_taken,
        detected_at
      FROM spike_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      ORDER BY detected_at DESC
      `,
      [projectId, startTime, endTime]
    )

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Spike Detection] Error querying detections:', error)
    return { success: false, error }
  }
}

/**
 * Get recent spike detections across all projects
 *
 * @param limit - Maximum number of records to return
 * @param severity - Optional severity filter
 */
export async function getRecentSpikeDetections(
  limit: number = 100,
  severity?: string
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    project_id: string
    metric_type: string
    current_value: number
    average_value: number
    multiplier: number
    severity: string
    action_taken: string
    detected_at: Date
  }>
  error?: unknown
}> {
  const pool = getPool()

  try {
    let query = `
      SELECT
        id,
        project_id,
        metric_type,
        current_value,
        average_value,
        multiplier,
        severity,
        action_taken,
        detected_at
      FROM spike_detections
    `

    const params: (string | number)[] = []
    let paramCount = 0

    if (severity) {
      paramCount++
      query += ` WHERE severity = $${paramCount}`
      params.push(severity)
    }

    query += ` ORDER BY detected_at DESC LIMIT $${paramCount + 1}`
    params.push(limit)

    const result = await pool.query(query, params)

    return { success: true, data: result.rows }
  } catch (error) {
    console.error('[Spike Detection] Error querying recent detections:', error)
    return { success: false, error }
  }
}

/**
 * Get spike detection statistics for a project
 *
 * @param projectId - The project ID
 * @param startTime - Start of time range
 * @param endTime - End of time range
 */
export async function getSpikeDetectionStatistics(
  projectId: string,
  startTime: Date,
  endTime: Date
): Promise<{
  success: boolean
  data?: {
    total_detections: number
    by_severity: { warning: number; critical: number; severe: number }
    by_metric_type: Record<string, number>
    by_action: { none: number; warning: number; suspension: number }
  }
  error?: unknown
}> {
  const pool = getPool()

  try {
    // Get total detections
    const totalResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM spike_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      `,
      [projectId, startTime, endTime]
    )

    // Get by severity
    const severityResult = await pool.query(
      `
      SELECT severity, COUNT(*) as count
      FROM spike_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      GROUP BY severity
      `,
      [projectId, startTime, endTime]
    )

    // Get by metric type
    const metricResult = await pool.query(
      `
      SELECT metric_type, COUNT(*) as count
      FROM spike_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      GROUP BY metric_type
      `,
      [projectId, startTime, endTime]
    )

    // Get by action taken
    const actionResult = await pool.query(
      `
      SELECT action_taken, COUNT(*) as count
      FROM spike_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      GROUP BY action_taken
      `,
      [projectId, startTime, endTime]
    )

    // Process results
    const bySeverity = { warning: 0, critical: 0, severe: 0 }
    severityResult.rows.forEach((row: { severity: string; count: number }) => {
      bySeverity[row.severity as keyof typeof bySeverity] = row.count
    })

    const byMetricType: Record<string, number> = {}
    metricResult.rows.forEach((row: { metric_type: string; count: number }) => {
      byMetricType[row.metric_type] = row.count
    })

    const byAction = { none: 0, warning: 0, suspension: 0 }
    actionResult.rows.forEach((row: { action_taken: string; count: number }) => {
      byAction[row.action_taken as keyof typeof byAction] = row.count
    })

    return {
      success: true,
      data: {
        total_detections: parseInt(totalResult.rows[0].count),
        by_severity: bySeverity,
        by_metric_type: byMetricType,
        by_action: byAction,
      },
    }
  } catch (error) {
    console.error('[Spike Detection] Error calculating statistics:', error)
    return { success: false, error }
  }
}

/**
 * Clean up old spike detection records to prevent table bloat
 *
 * @param retentionDays - Number of days to retain records (default: 90)
 */
export async function cleanupOldSpikeDetections(retentionDays: number = 90): Promise<{
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
      DELETE FROM spike_detections
      WHERE detected_at < $1
      `,
      [cutoffDate]
    )

    const deletedCount = result.rowCount || 0

    console.log(
      `[Spike Detection] Cleaned up ${deletedCount} old detection records (older than ${retentionDays} days)`
    )

    return { success: true, deletedCount }
  } catch (error) {
    console.error('[Spike Detection] Error cleaning up old detections:', error)
    return { success: false, error }
  }
}
