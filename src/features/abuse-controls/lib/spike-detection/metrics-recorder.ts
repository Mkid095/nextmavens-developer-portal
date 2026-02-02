/**
 * Metrics Recorder Module
 * Functions for recording usage metrics
 */

import { getPool } from '@/lib/db'
import type { HardCapType } from '../../types'

/**
 * Record a usage metric for spike detection
 *
 * This function should be called periodically to record usage metrics.
 * For now, this is a placeholder that will be integrated with actual
 * usage tracking when implemented.
 *
 * @param projectId - The project to record metrics for
 * @param metricType - The type of metric
 * @param metricValue - The value of the metric
 */
export async function recordUsageMetric(
  projectId: string,
  metricType: string,
  metricValue: number
): Promise<void> {
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
      `[Spike Detection] Recorded metric for project ${projectId}: ${metricType} = ${metricValue}`
    )
  } catch (error) {
    console.error('[Spike Detection] Error recording usage metric:', error)
    throw new Error('Failed to record usage metric')
  }
}

/**
 * Batch record usage metrics for a project
 *
 * @param projectId - The project to record metrics for
 * @param metrics - Object mapping metric types to values
 */
export async function recordUsageMetrics(
  projectId: string,
  metrics: Partial<Record<HardCapType, number>>
): Promise<void> {
  for (const [metricType, value] of Object.entries(metrics)) {
    if (value !== undefined) {
      await recordUsageMetric(projectId, metricType, value)
    }
  }
}
