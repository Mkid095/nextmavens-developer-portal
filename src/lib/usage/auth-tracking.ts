/**
 * Auth Usage Tracking Service
 *
 * Tracks auth usage metrics for user growth analytics:
 * - auth_signup: Number of user registrations
 * - auth_signin: Number of successful logins
 *
 * All tracking is done asynchronously (fire-and-forget) to avoid blocking requests.
 *
 * US-005 from prd-usage-tracking.json
 */

import { getPool } from '@/lib/db'

export type AuthMetricType = 'auth_signup' | 'auth_signin'

export interface AuthUsageMetric {
  projectId: string
  metricType: AuthMetricType
  quantity: number
}

/**
 * Record an auth usage metric
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
 * recordAuthMetric({
 *   projectId: 'abc-123',
 *   metricType: 'auth_signup',
 *   quantity: 1
 * }).catch(err => console.error('Failed to record metric:', err))
 */
export async function recordAuthMetric(
  metric: AuthUsageMetric
): Promise<void> {
  const { projectId, metricType, quantity } = metric

  // Validate inputs
  if (!projectId) {
    console.error('[AuthUsageTracking] Missing projectId')
    return
  }

  if (!['auth_signup', 'auth_signin'].includes(metricType)) {
    console.error('[AuthUsageTracking] Invalid metricType:', metricType)
    return
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    console.error('[AuthUsageTracking] Invalid quantity:', quantity)
    return
  }

  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ($1, 'auth', $2, $3, NOW())
      `,
      [projectId, metricType, quantity]
    )

    // Debug logging (can be disabled in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuthUsageTracking] Recorded: ${metricType} = ${quantity} for project ${projectId}`)
    }
  } catch (error: any) {
    // Don't throw - this is a fire-and-forget operation
    console.error('[AuthUsageTracking] Failed to record metric:', {
      projectId,
      metricType,
      quantity,
      error: error.message,
    })
  }
}

/**
 * Record multiple auth metrics in a single query
 *
 * More efficient than recording metrics individually when you have
 * multiple metrics to track for a single request.
 *
 * @param metrics - Array of metrics to record
 * @returns Promise that resolves when recording is complete
 *
 * @example
 * // Fire and forget
 * recordAuthMetrics([
 *   { projectId: 'abc-123', metricType: 'auth_signup', quantity: 1 }
 * ]).catch(err => console.error('Failed to record metrics:', err))
 */
export async function recordAuthMetrics(
  metrics: AuthUsageMetric[]
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
      placeholders.push(`($${baseIndex + 1}, 'auth', $${baseIndex + 2}, $${baseIndex + 3}, NOW())`)
    })

    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ${placeholders.join(', ')}
      `,
      values
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuthUsageTracking] Recorded ${metrics.length} metrics`)
    }
  } catch (error: any) {
    console.error('[AuthUsageTracking] Failed to record metrics:', {
      metricCount: metrics.length,
      error: error.message,
    })
  }
}

/**
 * Track an auth signup (user registration)
 *
 * Convenience function for recording a single signup.
 *
 * @param projectId - The project ID
 *
 * @example
 * // Fire and forget
 * trackAuthSignup('abc-123')
 */
export function trackAuthSignup(
  projectId: string
): void {
  // Don't await - fire and forget
  recordAuthMetric({
    projectId,
    metricType: 'auth_signup',
    quantity: 1,
  }).catch(err => {
    // Silent fail - logging errors in the recording function
  })
}

/**
 * Track an auth signin (user login)
 *
 * Convenience function for recording a single signin.
 *
 * @param projectId - The project ID
 *
 * @example
 * // Fire and forget
 * trackAuthSignin('abc-123')
 */
export function trackAuthSignin(
  projectId: string
): void {
  // Don't await - fire and forget
  recordAuthMetric({
    projectId,
    metricType: 'auth_signin',
    quantity: 1,
  }).catch(err => {
    // Silent fail - logging errors in the recording function
  })
}

/**
 * Get auth usage statistics for a project
 *
 * Aggregates auth metrics for a project within a time range.
 *
 * @param projectId - The project ID
 * @param startDate - Start date for aggregation (default: 30 days ago)
 * @param endDate - End date for aggregation (default: now)
 * @returns Aggregated auth usage statistics
 */
export async function getAuthUsageStats(
  projectId: string,
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: Date = new Date()
): Promise<{
  success: boolean
  data?: {
    signupCount: number
    signinCount: number
    breakdownByDay: Array<{
      date: string
      signupCount: number
      signinCount: number
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
        SUM(CASE WHEN metric_type = 'auth_signup' THEN quantity ELSE 0 END) as auth_signup_count,
        SUM(CASE WHEN metric_type = 'auth_signin' THEN quantity ELSE 0 END) as auth_signin_count
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'auth'
        AND recorded_at >= $2
        AND recorded_at <= $3
      `,
      [projectId, startDate, endDate]
    )

    const row = result.rows[0]
    const signupCount = parseInt(row.auth_signup_count) || 0
    const signinCount = parseInt(row.auth_signin_count) || 0

    // Get breakdown by day
    const breakdownResult = await pool.query(
      `
      SELECT
        DATE(recorded_at) as date,
        SUM(CASE WHEN metric_type = 'auth_signup' THEN quantity ELSE 0 END) as auth_signup_count,
        SUM(CASE WHEN metric_type = 'auth_signin' THEN quantity ELSE 0 END) as auth_signin_count
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND service = 'auth'
        AND recorded_at >= $2
        AND recorded_at <= $3
      GROUP BY DATE(recorded_at)
      ORDER BY date DESC
      `,
      [projectId, startDate, endDate]
    )

    const breakdownByDay = breakdownResult.rows.map(row => ({
      date: row.date,
      signupCount: parseInt(row.auth_signup_count) || 0,
      signinCount: parseInt(row.auth_signin_count) || 0,
    }))

    return {
      success: true,
      data: {
        signupCount,
        signinCount,
        breakdownByDay,
      },
    }
  } catch (error: any) {
    console.error('[AuthUsageTracking] Error getting auth usage stats:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get current auth usage for user growth analytics
 *
 * Returns usage counts for the current billing period (last 30 days).
 *
 * @param projectId - The project ID
 * @returns Current usage counts
 */
export async function getCurrentAuthUsage(
  projectId: string
): Promise<{
  success: boolean
  data?: {
    signupCount: number
    signinCount: number
  }
  error?: string
}> {
  const stats = await getAuthUsageStats(projectId)

  if (!stats.success || !stats.data) {
    return stats
  }

  return {
    success: true,
    data: {
      signupCount: stats.data.signupCount,
      signinCount: stats.data.signinCount,
    },
  }
}
