/**
 * Auth Usage Tracking Module - Recording Functions
 */

import { getPool } from '@/lib/db'
import type { AuthUsageMetric } from './types'
import { SERVICE_NAME, LOG_PREFIXES, SQL_QUERIES } from './constants'
import { validateAuthMetric } from './validators'

/**
 * Record an auth usage metric
 *
 * Records the metric to the usage_metrics table asynchronously.
 * This function is designed to be called in a fire-and-forget manner
 * to avoid blocking API requests.
 *
 * @param metric - The metric to record
 * @returns Promise that resolves when recording is complete
 */
export async function recordAuthMetric(metric: AuthUsageMetric): Promise<void> {
  if (!validateAuthMetric(metric)) {
    return
  }

  const { projectId, metricType, quantity } = metric
  const pool = getPool()

  try {
    await pool.query(SQL_QUERIES.INSERT_METRIC, [
      projectId,
      SERVICE_NAME,
      metricType,
      quantity,
    ])

    // Debug logging (can be disabled in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`${LOG_PREFIXES.RECORDED_METRIC} ${metricType} = ${quantity} for project ${projectId}`)
    }
  } catch (error: any) {
    // Don't throw - this is a fire-and-forget operation
    console.error(LOG_PREFIXES.FAILED_TO_RECORD, {
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
 */
export async function recordAuthMetrics(metrics: AuthUsageMetric[]): Promise<void> {
  if (!metrics || metrics.length === 0) {
    return
  }

  const pool = getPool()

  try {
    // Build values array for bulk insert
    const values: any[] = []
    const placeholders: string[] = []

    metrics.forEach((metric, index) => {
      const baseIndex = index * 4
      values.push(metric.projectId, SERVICE_NAME, metric.metricType, metric.quantity)
      placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, NOW())`)
    })

    await pool.query(
      `
      INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
      VALUES ${placeholders.join(', ')}
      `,
      values
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(`${LOG_PREFIXES.RECORDED_METRICS} ${metrics.length} ${LOG_PREFIXES.METRICS_COUNT}`)
    }
  } catch (error: any) {
    console.error(LOG_PREFIXES.FAILED_TO_RECORD, {
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
 * @returns Promise that resolves when tracking is complete
 */
export function trackAuthSignup(projectId: string): Promise<void> {
  return recordAuthMetric({
    projectId,
    metricType: 'auth_signup',
    quantity: 1,
  })
}

/**
 * Track an auth signin (user login)
 *
 * Convenience function for recording a single signin.
 *
 * @param projectId - The project ID
 * @returns Promise that resolves when tracking is complete
 */
export function trackAuthSignin(projectId: string): Promise<void> {
  return recordAuthMetric({
    projectId,
    metricType: 'auth_signin',
    quantity: 1,
  })
}
