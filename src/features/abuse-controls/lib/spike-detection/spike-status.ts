/**
 * Spike Detection Status Module
 * Functions for getting spike detection status, history, and configuration
 */

import { getPool } from '@/lib/db'
import type { SpikeDetectionResult } from '../../types'
import {
  SPIKE_THRESHOLD,
  SPIKE_DETECTION_WINDOW_MS,
  SPIKE_BASELINE_PERIOD_MS,
  MIN_USAGE_FOR_SPIKE_DETECTION,
  DEFAULT_SPIKE_ACTION_THRESHOLDS,
} from '../config'
import { checkProjectForSpikes } from './spike-checker'

/**
 * Get spike detection configuration
 *
 * @returns Current spike detection configuration
 */
export function getSpikeDetectionConfig(): {
  threshold: number
  detectionWindowMs: number
  baselinePeriodMs: number
  minUsageForDetection: number
  actionThresholds: Array<{ minMultiplier: number; action: string }>
} {
  return {
    threshold: SPIKE_THRESHOLD,
    detectionWindowMs: SPIKE_DETECTION_WINDOW_MS,
    baselinePeriodMs: SPIKE_BASELINE_PERIOD_MS,
    minUsageForDetection: MIN_USAGE_FOR_SPIKE_DETECTION,
    actionThresholds: DEFAULT_SPIKE_ACTION_THRESHOLDS.map((t) => ({
      minMultiplier: t.minMultiplier,
      action: t.action,
    })),
  }
}

/**
 * Get spike detection history for a project
 *
 * @param projectId - The project to get history for
 * @param hours - Number of hours to look back (default: 24)
 * @returns Array of detected spikes in the time period
 */
export async function getSpikeDetectionHistory(
  projectId: string,
  hours: number = 24
): Promise<SpikeDetectionResult[]> {
  const pool = getPool()

  try {
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)
    const endTime = new Date()

    const result = await pool.query(
      `
      SELECT
        project_id,
        metric_type as "capType",
        current_value as "currentUsage",
        average_value as "averageUsage",
        multiplier as "spikeMultiplier",
        severity,
        action_taken as "actionTaken",
        detected_at as "detectedAt"
      FROM spike_detections
      WHERE project_id = $1
        AND detected_at >= $2
        AND detected_at <= $3
      ORDER BY detected_at DESC
      `,
      [projectId, startTime, endTime]
    )

    return result.rows.map((row) => ({
      projectId: row.project_id,
      capType: row.capType,
      spikeDetected: true,
      currentUsage: row.currentUsage,
      averageUsage: row.averageUsage,
      spikeMultiplier: row.spikeMultiplier,
      severity: row.severity,
      actionTaken: row.actionTaken,
      detectedAt: row.detectedAt,
    }))
  } catch (error) {
    console.error('[Spike Detection] Error getting detection history:', error)
    return []
  }
}

/**
 * Check a specific project for usage spikes
 *
 * @param projectId - The project to check
 * @returns Array of detected spikes (empty if none)
 */
export async function checkProjectSpikeStatus(
  projectId: string
): Promise<SpikeDetectionResult[]> {
  return checkProjectForSpikes(projectId)
}

/**
 * Get current spike detection status for all projects
 *
 * @returns Summary of spike detection status across all projects
 */
export async function getSpikeDetectionSummary(): Promise<{
  totalProjects: number
  activeDetections: number
  recentSuspensions: number
  bySeverity: Record<string, number>
}> {
  const pool = getPool()

  try {
    // Get total active projects
    const projectsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM projects
      WHERE status = 'active'
      `
    )
    const totalProjects = parseInt(projectsResult.rows[0].count)

    // Get active detections in the last 24 hours
    const dayAgo = new Date()
    dayAgo.setHours(dayAgo.getHours() - 24)

    const detectionsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM spike_detections
      WHERE detected_at >= $1
      `,
      [dayAgo]
    )
    const activeDetections = parseInt(detectionsResult.rows[0].count)

    // Get recent suspensions (action_taken = 'suspension' in last 24 hours)
    const suspensionsResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM spike_detections
      WHERE detected_at >= $1
        AND action_taken = 'suspension'
      `,
      [dayAgo]
    )
    const recentSuspensions = parseInt(suspensionsResult.rows[0].count)

    // Get breakdown by severity
    const severityResult = await pool.query(
      `
      SELECT severity, COUNT(*) as count
      FROM spike_detections
      WHERE detected_at >= $1
      GROUP BY severity
      `,
      [dayAgo]
    )

    const bySeverity: Record<string, number> = {}
    severityResult.rows.forEach((row: { severity: string; count: string }) => {
      bySeverity[row.severity] = parseInt(row.count)
    })

    return {
      totalProjects,
      activeDetections,
      recentSuspensions,
      bySeverity,
    }
  } catch (error) {
    console.error('[Spike Detection] Error getting summary:', error)
    return {
      totalProjects: 0,
      activeDetections: 0,
      recentSuspensions: 0,
      bySeverity: {},
    }
  }
}
