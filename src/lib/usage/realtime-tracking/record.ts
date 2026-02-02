/**
 * Realtime Usage Recording
 */

import { getPool } from '@/lib/db'
import type { RealtimeUsageMetric } from './types'

export async function recordRealtimeMetric(metric: RealtimeUsageMetric): Promise<void> {
  const { projectId, metricType, quantity } = metric

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
      `INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
       VALUES ($1, 'realtime', $2, $3, NOW())`,
      [projectId, metricType, quantity]
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(`[RealtimeUsageTracking] Recorded: ${metricType} = ${quantity} for project ${projectId}`)
    }
  } catch (error: any) {
    console.error('[RealtimeUsageTracking] Failed to record metric:', {
      projectId,
      metricType,
      quantity,
      error: error.message,
    })
  }
}

export async function recordRealtimeMetrics(metrics: RealtimeUsageMetric[]): Promise<void> {
  if (!metrics || metrics.length === 0) return

  const pool = getPool()

  try {
    const values: any[] = []
    const placeholders: string[] = []

    metrics.forEach((metric, index) => {
      const baseIndex = index * 3
      values.push(metric.projectId, metric.metricType, metric.quantity)
      placeholders.push(`($${baseIndex + 1}, 'realtime', $${baseIndex + 2}, $${baseIndex + 3}, NOW())`)
    })

    await pool.query(
      `INSERT INTO control_plane.usage_metrics (project_id, service, metric_type, quantity, recorded_at)
       VALUES ${placeholders.join(', ')}`,
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
