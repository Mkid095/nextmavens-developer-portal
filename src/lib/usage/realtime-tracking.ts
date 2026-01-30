/**
 * Realtime Usage Tracking Service
 *
 * Tracks realtime usage metrics for quota enforcement and billing:
 * - realtime_message: Number of messages sent over realtime connections
 * - realtime_connection: Number of realtime connections established
 *
 * All tracking is done asynchronously (fire-and-forget) to avoid blocking requests.
 * Connection counts are tracked per hour for accurate quota management.
 *
 * US-003 from prd-usage-tracking.json
 */

import { getPool } from '@/lib/db'

export type RealtimeMetricType = 'realtime_message' | 'realtime_connection'

export interface RealtimeUsageMetric {
  projectId: string
  metricType: RealtimeMetricType
  quantity: number
}

/**
 * Record a realtime usage metric
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
 * recordRealtimeMetric({
 *   projectId: 'abc-123',
 *   metricType: 'realtime_message',
 *   quantity: 1
 * }).catch(err => console.error('Failed to record metric:', err))
 */
export async function recordRealtimeMetric(
  metric: RealtimeUsageMetric
): Promise<void> {
  const { projectId, metricType, quantity } = metric

  // Validate inputs
  if (!projectId) {
    console.error('[RealtimeUsageTracking] Missing projectId')
    return
  }

  if (!['realtime_message', 'realtime_connection'].includes(metricType)) {
    console.error('[RealtimeUsageTracking] Invalid metricType:', metricType)
    return
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    console.error('[RealtimeUsageTracking] Invalid quantity:', quantity)
    return
  }

  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ($1, 'realtime', $2, $3, NOW())
      `,
      [projectId, metricType, quantity]
    )

    // Debug logging (can be disabled in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RealtimeUsageTracking] Recorded: ${metricType} = ${quantity} for project ${projectId}`)
    }
  } catch (error: any) {
    // Don't throw - this is a fire-and-forget operation
    console.error('[RealtimeUsageTracking] Failed to record metric:', {
      projectId,
      metricType,
      quantity,
      error: error.message,
    })
  }
}

/**
 * Record multiple realtime metrics in a single query
 *
 * More efficient than recording metrics individually when you have
 * multiple metrics to track for a single request.
 *
 * @param metrics - Array of metrics to record
 * @returns Promise that resolves when recording is complete
 *
 * @example
 * // Fire and forget
 * recordRealtimeMetrics([
 *   { projectId: 'abc-123', metricType: 'realtime_message', quantity: 1 },
 *   { projectId: 'abc-123', metricType: 'realtime_connection', quantity: 1 }
 * ]).catch(err => console.error('Failed to record metrics:', err))
 */
export async function recordRealtimeMetrics(
  metrics: RealtimeUsageMetric[]
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
      placeholders.push(`($${baseIndex + 1}, 'realtime', $${baseIndex + 2}, $${baseIndex + 3}, NOW())`)
    })

    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ${placeholders.join(', ')}
      `,
      values
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(`[RealtimeUsageTracking] Recorded ${metrics.length} metrics`)
    }
  } catch (error: any) {
    console.error('[RealtimeUsageTracking] Failed to record metrics:', {
      metricCount: metrics.length,
      error: error.message,
    })
  }
}

/**
 * Track a realtime message
 *
 * Convenience function for recording a single realtime message.
 *
 * @param projectId - The project ID
 *
 * @example
 * // Fire and forget
 * trackRealtimeMessage('abc-123')
 */
export function trackRealtimeMessage(
  projectId: string
): void {
  // Don't await - fire and forget
  recordRealtimeMetric({
    projectId,
    metricType: 'realtime_message',
    quantity: 1,
  }).catch(err => {
    // Silent fail - logging errors in the recording function
  })
}

/**
 * Track multiple realtime messages
 *
 * Use this function when multiple messages are sent in a batch.
 *
 * @param projectId - The project ID
 * @param messageCount - Number of messages sent
 *
 * @example
 * // Fire and forget
 * trackRealtimeMessages('abc-123', 5)
 */
export function trackRealtimeMessages(
  projectId: string,
  messageCount: number
): void {
  if (messageCount <= 0) {
    return
  }

  // Don't await - fire and forget
  recordRealtimeMetric({
    projectId,
    metricType: 'realtime_message',
    quantity: messageCount,
  }).catch(err => {
    // Silent fail - logging errors in the recording function
  })
}

/**
 * Track a realtime connection
 *
 * Records a new realtime connection for a project.
 * Connection counts are tracked per hour for quota enforcement.
 *
 * @param projectId - The project ID
 *
 * @example
 * // Fire and forget
 * trackRealtimeConnection('abc-123')
 */
export function trackRealtimeConnection(
  projectId: string
): void {
  // Don't await - fire and forget
  recordRealtimeMetric({
    projectId,
    metricType: 'realtime_connection',
    quantity: 1,
  }).catch(err => {
    // Silent fail - logging errors in the recording function
  })
}

/**
 * Get realtime usage statistics for a project
 *
 * Aggregates realtime metrics for a project within a time range.
 *
 * @param projectId - The project ID
 * @param startDate - Start date for aggregation (default: 30 days ago)
 * @param endDate - End date for aggregation (default: now)
 * @returns Aggregated realtime usage statistics
 */
export async function getRealtimeUsageStats(
  projectId: string,
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: Date = new Date()
): Promise<{
  success: boolean
  data?: {
    messageCount: number
    connectionCount: number
    breakdownByDay: Array<{
      date: string
      messageCount: number
      connectionCount: number
    }>
    breakdownByHour: Array<{
      hour: string
      messageCount: number
      connectionCount: number
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
        SUM(CASE WHEN metric_type = 'realtime_message' THEN quantity ELSE 0 END) as realtime_message_count,
        SUM(CASE WHEN metric_type = 'realtime_connection' THEN quantity ELSE 0 END) as realtime_connection_count
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'realtime'
        AND recorded_at >= $2
        AND recorded_at <= $3
      `,
      [projectId, startDate, endDate]
    )

    const row = result.rows[0]
    const messageCount = parseInt(row.realtime_message_count) || 0
    const connectionCount = parseInt(row.realtime_connection_count) || 0

    // Get breakdown by day
    const breakdownResult = await pool.query(
      `
      SELECT
        DATE(recorded_at) as date,
        SUM(CASE WHEN metric_type = 'realtime_message' THEN quantity ELSE 0 END) as realtime_message_count,
        SUM(CASE WHEN metric_type = 'realtime_connection' THEN quantity ELSE 0 END) as realtime_connection_count
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'realtime'
        AND recorded_at >= $2
        AND recorded_at <= $3
      GROUP BY DATE(recorded_at)
      ORDER BY date DESC
      `,
      [projectId, startDate, endDate]
    )

    const breakdownByDay = breakdownResult.rows.map(row => ({
      date: row.date,
      messageCount: parseInt(row.realtime_message_count) || 0,
      connectionCount: parseInt(row.realtime_connection_count) || 0,
    }))

    // Get breakdown by hour (for more granular connection tracking)
    const hourlyBreakdownResult = await pool.query(
      `
      SELECT
        DATE_TRUNC('hour', recorded_at) as hour,
        SUM(CASE WHEN metric_type = 'realtime_message' THEN quantity ELSE 0 END) as realtime_message_count,
        SUM(CASE WHEN metric_type = 'realtime_connection' THEN quantity ELSE 0 END) as realtime_connection_count
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'realtime'
        AND recorded_at >= $2
        AND recorded_at <= $3
      GROUP BY DATE_TRUNC('hour', recorded_at)
      ORDER BY hour DESC
      LIMIT 168
      `,
      [projectId, startDate, endDate]
    )

    const breakdownByHour = hourlyBreakdownResult.rows.map(row => ({
      hour: row.hour,
      messageCount: parseInt(row.realtime_message_count) || 0,
      connectionCount: parseInt(row.realtime_connection_count) || 0,
    }))

    return {
      success: true,
      data: {
        messageCount,
        connectionCount,
        breakdownByDay,
        breakdownByHour,
      },
    }
  } catch (error: any) {
    console.error('[RealtimeUsageTracking] Error getting realtime usage stats:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get current realtime usage for quota checking
 *
 * Returns usage counts for the current billing period (last 30 days).
 *
 * @param projectId - The project ID
 * @returns Current usage counts
 */
export async function getCurrentRealtimeUsage(
  projectId: string
): Promise<{
  success: boolean
  data?: {
    messageCount: number
    connectionCount: number
  }
  error?: string
}> {
  const stats = await getRealtimeUsageStats(projectId)

  if (!stats.success || !stats.data) {
    return stats
  }

  return {
    success: true,
    data: {
      messageCount: stats.data.messageCount,
      connectionCount: stats.data.connectionCount,
    },
  }
}

/**
 * Get realtime connection count for the current hour
 *
 * Returns the number of connections established in the current hour.
 * This is useful for enforcing hourly connection limits.
 *
 * @param projectId - The project ID
 * @returns Connection count for the current hour
 */
export async function getCurrentHourConnectionCount(
  projectId: string
): Promise<{
  success: boolean
  data?: {
    connectionCount: number
  }
  error?: string
}> {
  const pool = getPool()

  try {
    const startOfHour = new Date()
    startOfHour.setMinutes(0, 0, 0)

    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(quantity), 0) as connection_count
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'realtime'
        AND metric_type = 'realtime_connection'
        AND recorded_at >= $2
      `,
      [projectId, startOfHour]
    )

    const connectionCount = parseInt(result.rows[0].connection_count) || 0

    return {
      success: true,
      data: {
        connectionCount,
      },
    }
  } catch (error: any) {
    console.error('[RealtimeUsageTracking] Error getting current hour connection count:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
